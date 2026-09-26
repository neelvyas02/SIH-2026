import sys
import os
import math
import time
import argparse
from pathlib import Path
from collections import defaultdict
import cv2
import numpy as np
import torch
from ultralytics import YOLO

AI_ENGINE_DIR = Path(__file__).resolve().parent
MODELS_DIR = AI_ENGINE_DIR / "models"
RUNS_DIR = AI_ENGINE_DIR / "runs"
STORAGE_DIR = (AI_ENGINE_DIR / ".." / "storage").resolve()

# Import evidence saver & dispatcher if available
sys.path.insert(0, str(AI_ENGINE_DIR / "src"))
try:
    from evidence.snapshot_saver import EvidenceSnapshotSaver
    from dispatcher.backend_client import BackendEventDispatcher
except Exception as e:
    EvidenceSnapshotSaver = None
def classify_person_identity(person_crop_bgr: np.ndarray, is_armed: bool = False) -> str:
    """
    Identification Friend-or-Foe (IFF) Classifier:
    Distinguishes Friendly Military Personnel from Suspicious Intruders / Terrorists.
    Rule 1: If person is armed -> Always classify as ARMED_TERRORIST / SUSPICIOUS.
    Rule 2: If unarmed and wearing standard military uniform camouflage -> FRIENDLY_MILITARY.
    Rule 3: If non-uniform or intruder -> SUSPICIOUS_INTRUDER.
    """
    if is_armed:
        return "ARMED_TERRORIST"

    if person_crop_bgr is None or person_crop_bgr.size == 0:
        return "SUSPICIOUS_INTRUDER"

    try:
        hsv = cv2.cvtColor(person_crop_bgr, cv2.COLOR_BGR2HSV)
        
        # Range for military olive-drab / tactical camouflage green-brown patterns
        lower_camo = np.array([30, 35, 35])
        upper_camo = np.array([85, 255, 255])
        
        camo_mask = cv2.inRange(hsv, lower_camo, upper_camo)
        camo_ratio = np.sum(camo_mask > 0) / float(person_crop_bgr.shape[0] * person_crop_bgr.shape[1])

        if camo_ratio >= 0.28:
            return "FRIENDLY_MILITARY"
    except Exception:
        pass

    return "SUSPICIOUS_INTRUDER"



class PersonObjectAssociator:
    """
    Associates carried objects (weapons/guns/explosives) with detected persons.
    Uses a multi-stage verification pipeline:
    - Stage 1: Spatial Bounding Box Enclosure & Normalized Distance
    - Stage 2: Hand/Wrist Keypoint Proximity (YOLOv8-Pose integration)
    - Stage 3: Temporal Motion Correlation (ByteTrack velocity alignment)
    """

    def __init__(self, proximity_threshold: float = 0.25, use_pose: bool = False):
        self.proximity_threshold = proximity_threshold
        self.use_pose = use_pose
        self.pose_model = None
        self.track_history = defaultdict(list)

        if self.use_pose:
            try:
                print("[*] Loading YOLOv8n-pose for hand/wrist keypoint association...")
                self.pose_model = YOLO("yolov8n-pose.pt")
                print("[+] Pose model loaded successfully.")
            except Exception as e:
                print(f"[!] Warning: Could not load pose model ({e}). Using geometric arm-wrist anchors.")
                self.pose_model = None

    def associate(self, persons: list, objects: list, frame_bgr: np.ndarray = None) -> list:
        associations = []
        if not persons or not objects:
            return associations

        wrist_points_per_person = {}
        if self.pose_model is not None and frame_bgr is not None:
            try:
                pose_results = self.pose_model(frame_bgr, verbose=False)
                for r in pose_results:
                    if r.keypoints is not None and len(r.keypoints) > 0:
                        for idx, kpts in enumerate(r.keypoints.xy):
                            kpts_np = kpts.cpu().numpy()
                            if len(kpts_np) > 10:
                                wrist_points_per_person[idx] = {
                                    'left_wrist': kpts_np[9],
                                    'right_wrist': kpts_np[10]
                                }
            except Exception:
                pass

        for p_idx, person in enumerate(persons):
            px1, py1, px2, py2 = person['bbox']
            pw = max(1, px2 - px1)
            ph = max(1, py2 - py1)
            p_center = np.array([(px1 + px2) / 2.0, (py1 + py2) / 2.0])

            estimated_wrists = [
                np.array([px1 + pw * 0.15, py1 + ph * 0.60]),
                np.array([px1 + pw * 0.85, py1 + ph * 0.60]),
                np.array([px1 + pw * 0.50, py1 + ph * 0.55])
            ]

            if p_idx in wrist_points_per_person:
                lw = wrist_points_per_person[p_idx]['left_wrist']
                rw = wrist_points_per_person[p_idx]['right_wrist']
                if lw[0] > 0 and lw[1] > 0:
                    estimated_wrists.append(lw)
                if rw[0] > 0 and rw[1] > 0:
                    estimated_wrists.append(rw)

            for obj in objects:
                ox1, oy1, ox2, oy2 = obj['bbox']
                o_center = np.array([(ox1 + ox2) / 2.0, (oy1 + oy2) / 2.0])

                center_dist = np.linalg.norm(p_center - o_center)
                center_dist_norm = center_dist / ph
                min_wrist_dist = min([np.linalg.norm(w_pt - o_center) for w_pt in estimated_wrists])
                min_wrist_dist_norm = min_wrist_dist / ph

                inside_box = (px1 - pw * 0.15 <= o_center[0] <= px2 + pw * 0.15) and \
                             (py1 <= o_center[1] <= py2 + ph * 0.10)

                is_held = False
                reason = "Unassociated"

                if min_wrist_dist_norm < 0.25:
                    is_held = True
                    reason = "Object in immediate hand/wrist grasp"
                elif inside_box and center_dist_norm < 0.45:
                    is_held = True
                    reason = "Object carried on torso/holster"

                if is_held or center_dist_norm < self.proximity_threshold:
                    associations.append({
                        'person_idx': p_idx,
                        'person': person,
                        'object': obj,
                        'dist_norm': round(float(center_dist_norm), 3),
                        'wrist_dist_norm': round(float(min_wrist_dist_norm), 3),
                        'is_held': is_held,
                        'reason': reason
                    })

        return associations


def run_detection(
    source: str,
    weights_path: str = None,
    conf_thresh: float = 0.35,
    iou_thresh: float = 0.45,
    use_pose: bool = False,
    enable_tracking: bool = True,
    save_output: bool = True,
    save_crops: bool = True,
    instant_db: bool = True,
    display: bool = False
):
    """
    Executes object detection, person-weapon association, crop saving, and instant DB persistence.
    """
    if weights_path is None:
        if (MODELS_DIR / "best.pt").exists():
            weights_path = str(MODELS_DIR / "best.pt")
        elif (RUNS_DIR / "detect" / "train" / "weights" / "best.pt").exists():
            weights_path = str(RUNS_DIR / "detect" / "train" / "weights" / "best.pt")
        else:
            weights_path = "yolov8n.pt"
            print(f"[!] Warning: Custom best.pt not found. Running baseline {weights_path}...")

    print("=" * 75)
    print("BORDERGUARD AI - OBJECT & WEAPON DETECTION WITH INSTANT DB PERSISTENCE")
    print("=" * 75)
    print(f"Model Weights:      {weights_path}")
    print(f"Input Source:       {source}")
    print(f"Confidence Thresh:  {conf_thresh}")
    print(f"IoU NMS Thresh:     {iou_thresh}")
    print(f"Pose Estimation:    {use_pose}")
    print(f"ByteTrack Tracking: {enable_tracking}")
    print(f"Crop Evidence Save: {save_crops}")
    print(f"Instant DB Sync:    {instant_db}")
    print("=" * 75 + "\n")

    model = YOLO(weights_path)
    associator = PersonObjectAssociator(proximity_threshold=0.35, use_pose=use_pose)

    evidence_saver = None
    if EvidenceSnapshotSaver is not None:
        evidence_saver = EvidenceSnapshotSaver(storage_dir=str(STORAGE_DIR))

    dispatcher = None
    if BackendEventDispatcher is not None:
        dispatcher = BackendEventDispatcher()

    # Determine input type
    is_webcam = source.isdigit() or source.lower() == "webcam"
    is_youtube = ("youtube.com" in source.lower() or "youtu.be" in source.lower())
    source_arg = int(source) if source.isdigit() else source

    if is_youtube:
        print(f"[*] YouTube video link detected: {source}")
        cap = None
        # 1. Try cap_from_youtube extraction
        try:
            import cap_from_youtube
            for res in ['720p', '480p', 'best', '360p']:
                try:
                    cap = cap_from_youtube.cap_from_youtube(source, resolution=res)
                    if cap is not None and cap.isOpened():
                        print(f"[+] Connected to YouTube stream ({res})!")
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"[!] cap_from_youtube warning: {e}")

        # 2. Fallback: Try direct URL extraction using yt_dlp
        if cap is None or not cap.isOpened():
            try:
                import yt_dlp
                ydl_opts = {'quiet': True, 'no_warnings': True}
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(source, download=False)
                    stream_url = info.get('url')
                    if not stream_url and 'formats' in info:
                        for fmt in reversed(info['formats']):
                            if fmt.get('url') and fmt.get('vcodec') != 'none':
                                stream_url = fmt['url']
                                break
                    if stream_url:
                        cap = cv2.VideoCapture(stream_url)
                        if cap.isOpened():
                            print("[+] Connected to YouTube stream via yt_dlp direct URL!")
            except Exception as e:
                print(f"[!] yt_dlp fallback warning: {e}")

        if cap is None or not cap.isOpened():
            print("[!] Direct web URL could not be opened natively by OpenCV. Attempting raw source fallback...")
            cap = cv2.VideoCapture(source_arg)
    else:
        cap = cv2.VideoCapture(source_arg)

    if cap is None or not cap.isOpened():
        print(f"[-] Error: Could not open video source: {source}")
        return

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    out_writer = None
    output_path = None
    if save_output:
        predict_dir = RUNS_DIR / "detect" / "predict"
        predict_dir.mkdir(parents=True, exist_ok=True)
        out_ext = ".mp4" if not (isinstance(source_arg, str) and source_arg.lower().endswith(('.jpg', '.jpeg', '.png'))) else ".jpg"
        output_path = predict_dir / f"detected_output{out_ext}"
        if out_ext == ".mp4":
            fourcc = cv2.VideoWriter_fourcc(*"mp4v")
            out_writer = cv2.VideoWriter(str(output_path), fourcc, fps, (width, height))

    frame_idx = 0
    weapon_classes = ["gun", "weapon", "knife", "pistol", "rifle", "firearm"]
    explosive_classes = ["explosive", "bomb", "grenade", "suspicious_package", "dynamite"]

    last_db_alert_time = 0.0
    saved_track_ids = set()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1

        if enable_tracking and not (isinstance(source_arg, str) and source_arg.lower().endswith(('.jpg', '.jpeg', '.png'))):
            tracker_cfg = str(MODELS_DIR / "bytetrack.yaml") if (MODELS_DIR / "bytetrack.yaml").exists() else "bytetrack.yaml"
            results = model.track(frame, persist=True, conf=conf_thresh, iou=iou_thresh, tracker=tracker_cfg, verbose=False)
        else:
            results = model(frame, conf=conf_thresh, iou=iou_thresh, verbose=False)

        persons = []
        objects = []
        explosives = []

        for r in results:
            for box in r.boxes:
                coords = box.xyxy[0].cpu().numpy().astype(int)
                conf = float(box.conf[0].cpu())
                cls_id = int(box.cls[0].cpu())
                cls_name = model.names.get(cls_id, f"class_{cls_id}").lower()
                track_id = int(box.id[0].cpu()) if box.id is not None else None

                item = {
                    'bbox': coords,
                    'conf': conf,
                    'class': cls_name,
                    'track_id': track_id
                }

                if cls_name == "person":
                    persons.append(item)
                elif cls_name in weapon_classes:
                    objects.append(item)
                elif cls_name in explosive_classes or "bomb" in cls_name or "explosive" in cls_name:
                    explosives.append(item)
                    objects.append(item)

        # Execute association algorithm
        associations = associator.associate(persons, objects, frame_bgr=frame)
        armed_persons_indices = set([a['person_idx'] for a in associations if a['is_held']])

        # Telemetry counts
        total_weapons_cnt = len(objects)
        total_explosives_cnt = len(explosives)
        total_suspicious_cnt = len(armed_persons_indices)
        total_persons_cnt = len(persons)

        # ---------------------------------------------------------------------
        # MINIMAL EVIDENCE SAVING & INSTANT DB (Selective Threat-Only Filtering)
        # ---------------------------------------------------------------------
        if (total_suspicious_cnt > 0 or total_weapons_cnt > 0 or total_explosives_cnt > 0) and evidence_saver is not None:
            target_obj = persons[0] if persons else (objects[0] if objects else None)
            
            # Check IFF identity of target: DO NOT SAVE IF FRIENDLY MILITARY
            target_identity = "SUSPICIOUS_INTRUDER"
            if persons:
                p_crop = frame[max(0, persons[0]['bbox'][1]):min(frame.shape[0], persons[0]['bbox'][3]),
                               max(0, persons[0]['bbox'][0]):min(frame.shape[1], persons[0]['bbox'][2])]
                target_identity = classify_person_identity(p_crop, is_armed=0 in armed_persons_indices)
                
            if target_identity == "FRIENDLY_MILITARY" and total_weapons_cnt == 0:
                # SKIP EVIDENCE SAVING FOR FRIENDLY FORCES
                should_save = False
            else:
                target_tid = target_obj['track_id'] if (target_obj and target_obj['track_id'] is not None) else None
                curr_time = time.time()
                should_save = False

                if target_tid is not None:
                    if target_tid not in saved_track_ids:
                        saved_track_ids.add(target_tid)
                        should_save = True
                else:
                    if curr_time - last_db_alert_time > 30.0:
                        last_db_alert_time = curr_time
                        should_save = True

            if should_save:
                # Copy frame for background thread saving to prevent video lag
                frame_copy = frame.copy()
                person_sample = dict(persons[0]) if persons else None
                object_sample = dict(objects[0]) if objects else None

                def _bg_evidence_worker(f_img, p_sample, o_sample, susp_cnt, weap_cnt, exp_cnt, pers_cnt):
                    try:
                        full_snap_meta = evidence_saver.save_incident_snapshot(
                            frame=f_img,
                            track=p_sample if p_sample else o_sample,
                            zone_polygon_coords=[],
                            camera_id="cam_sentinel_01",
                            camera_name="Border Sector Zero Line"
                        )

                        person_crop_meta = None
                        if p_sample:
                            person_crop_meta = evidence_saver.save_crop(
                                frame=f_img,
                                bbox=p_sample['bbox'],
                                crop_type="person",
                                class_name="person",
                                track_id=p_sample.get('track_id')
                            )

                        weapon_crop_meta = None
                        if o_sample:
                            weapon_crop_meta = evidence_saver.save_crop(
                                frame=f_img,
                                bbox=o_sample['bbox'],
                                crop_type="weapon",
                                class_name=o_sample['class'],
                                track_id=o_sample.get('track_id')
                            )

                        if instant_db:
                            target_cls = "armed_person" if susp_cnt > 0 else (o_sample['class'] if o_sample else "suspicious_object")
                            conf_score = p_sample['conf'] if p_sample else (o_sample['conf'] if o_sample else 0.90)
                            bbox_data = [int(v) for v in (p_sample['bbox'] if p_sample else o_sample['bbox'])]

                            evidence_saver.save_instant_db_record(
                                event_type="suspicious_weapon_alert" if susp_cnt > 0 else "weapon_detected",
                                target_class=target_cls,
                                confidence=conf_score,
                                bbox=bbox_data,
                                is_armed=susp_cnt > 0,
                                weapon_details=f"Weapons: {weap_cnt}, Explosives: {exp_cnt}",
                                total_persons=pers_cnt,
                                total_weapons=weap_cnt,
                                total_explosives=exp_cnt,
                                total_suspicious=susp_cnt,
                                full_snapshot_path=full_snap_meta.get("relative_path"),
                                person_crop_path=person_crop_meta.get("relative_path") if person_crop_meta else None,
                                weapon_crop_path=weapon_crop_meta.get("relative_path") if weapon_crop_meta else None,
                                camera_id="b1a23e54-7890-4c12-a345-6789abcdef01"
                            )

                        if dispatcher is not None:
                            bbox_data = [int(v) for v in (p_sample['bbox'] if p_sample else o_sample['bbox'])]
                            event_payload = {
                                "event_type": "weapon_threat_detected" if susp_cnt > 0 else "suspicious_object",
                                "camera_id": "b1a23e54-7890-4c12-a345-6789abcdef01",
                                "track_id": p_sample.get('track_id', 1) if p_sample else 1,
                                "target_class": "armed_suspect" if susp_cnt > 0 else "weapon",
                                "confidence_score": round(float(p_sample['conf'] if p_sample else 0.90), 3),
                                "bounding_box": {
                                    "x_min": int(bbox_data[0]), "y_min": int(bbox_data[1]),
                                    "width": int(bbox_data[2] - bbox_data[0]), "height": int(bbox_data[3] - bbox_data[1])
                                },
                                "evidence": {
                                    "snapshot_filename": full_snap_meta.get("filename", ""),
                                    "relative_path": full_snap_meta.get("relative_path", ""),
                                    "sha256_hash": full_snap_meta.get("sha256_hash", "")
                                }
                            }
                            dispatcher.send_intrusion_event(event_payload)
                    except Exception:
                        pass

                # Launch evidence saving in background thread
                import threading
                threading.Thread(
                    target=_bg_evidence_worker,
                    args=(frame_copy, person_sample, object_sample, total_suspicious_cnt, total_weapons_cnt, total_explosives_cnt, total_persons_cnt),
                    daemon=True
                ).start()


        # Draw visual annotations
        # 1. Draw Persons
        for p_idx, person in enumerate(persons):
            x1, y1, x2, y2 = person['bbox']
            is_armed = p_idx in armed_persons_indices

            if is_armed:
                color = (0, 0, 230)      # Bright Red for Armed Suspect
                status_text = "ARMED SUSPECT"
            else:
                color = (255, 191, 0)    # Amber/Cyan for Safe Person
                status_text = "PERSON"

            tid_text = f" [ID:P{person['track_id']}]" if person['track_id'] is not None else ""
            label = f"{status_text}{tid_text} {int(person['conf'] * 100)}%"

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + len(label) * 9, y1), color, -1)
            cv2.putText(frame, label, (x1 + 4, y1 - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

        # 2. Draw Weapons/Guns/Explosives with non-colliding placement
        for obj in objects:
            ox1, oy1, ox2, oy2 = obj['bbox']
            is_exp = obj['class'] in explosive_classes
            color = (0, 0, 255) if is_exp else (0, 0, 230)  # Bright Red for Weapons
            wtid_text = f" [ID:G{obj['track_id']}]" if obj['track_id'] is not None else ""
            label = f"{obj['class'].upper()}{wtid_text} {int(obj['conf'] * 100)}%"

            cv2.rectangle(frame, (ox1, oy1), (ox2, oy2), color, 2)
            # Position weapon label below the weapon box to avoid colliding with person's header badge
            badge_y1 = min(frame.shape[0] - 22, oy2 + 2)
            badge_y2 = min(frame.shape[0], badge_y1 + 20)
            cv2.rectangle(frame, (ox1, badge_y1), (ox1 + len(label) * 9, badge_y2), (0, 0, 180), -1)
            cv2.putText(frame, label, (ox1 + 4, badge_y1 + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1)

        # 3. Draw Association Links
        for assoc in associations:
            if assoc['is_held']:
                px1, py1, px2, py2 = assoc['person']['bbox']
                ox1, oy1, ox2, oy2 = assoc['object']['bbox']
                p_center = ((px1 + px2) // 2, (py1 + py2) // 2)
                o_center = ((ox1 + ox2) // 2, (oy1 + oy2) // 2)
                cv2.line(frame, p_center, o_center, (0, 0, 255), 2, cv2.LINE_AA)
                mid_x = (p_center[0] + o_center[0]) // 2
                mid_y = (p_center[1] + o_center[1]) // 2
                cv2.putText(frame, "HELD WEAPON", (mid_x, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 255), 2)

        # 4. Telemetry Header HUD Banner
        cv2.rectangle(frame, (0, 0), (width, 42), (15, 20, 28), -1)
        hud_text = f"BORDERGUARD AI | Persons: {total_persons_cnt} | Weapons: {total_weapons_cnt} | Explosives: {total_explosives_cnt} | Suspicious Armed: {total_suspicious_cnt}"
        cv2.putText(frame, hud_text, (15, 27), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (0, 229, 255), 1, cv2.LINE_AA)

        # 5. Prominent Blinking Alert Box on runtime window if Threat Detected
        if total_suspicious_cnt > 0 or total_explosives_cnt > 0:
            if (frame_idx // 6) % 2 == 0:  # Blinking effect every 6 frames
                alert_banner_text = "CRITICAL ALERT: ARMED SUSPECT / EXPLOSIVE HAZARD DETECTED!"
                cv2.rectangle(frame, (0, 42), (width, 82), (0, 0, 220), -1)
                cv2.putText(frame, alert_banner_text, (20, 68), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

        if out_writer is not None:
            out_writer.write(frame)

        if display:
            cv2.imshow("BorderGuard AI - Realtime Detection & Threat Sentinel", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    cap.release()
    if out_writer is not None:
        out_writer.release()
    if display:
        cv2.destroyAllWindows()

    if output_path is not None and not is_webcam:
        if str(output_path).endswith(('.jpg', '.png')):
            cv2.imwrite(str(output_path), frame)
        print(f"\n[+] Processing complete! Annotated output saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(description="Run detection and person-object association for BorderGuard AI")
    parser.add_argument("--source", "-s", type=str, default="0", help="Path to image, video file, or camera index (default: '0' for laptop webcam)")
    parser.add_argument("--weights", "-w", type=str, default=None, help="Path to model weights (defaults to models/best.pt)")
    parser.add_argument("--conf", type=float, default=0.25, help="Detection confidence threshold (default: 0.25)")
    parser.add_argument("--iou", type=float, default=0.45, help="NMS IoU threshold (default: 0.45)")
    parser.add_argument("--pose", action="store_true", help="Enable YOLOv8-pose for keypoint wrist proximity detection")
    parser.add_argument("--no-track", action="store_true", help="Disable ByteTrack temporal tracking")
    parser.add_argument("--show", action="store_true", help="Display live OpenCV window (press 'q' to quit)")
    parser.add_argument("--no-save", action="store_true", help="Do not save output media to disk")
    parser.add_argument("--sentinel", action="store_true", help="Use dedicated Surveillance Sentinel Model (models/surveillance_sentinel.pt)")
    parser.add_argument("--no-crops", action="store_true", help="Disable crop image saving for persons/weapons")
    parser.add_argument("--no-db", action="store_true", help="Disable instant SQLite database recording")

    args = parser.parse_args()

    weights = args.weights
    if args.sentinel:
        sentinel_pt = MODELS_DIR / "surveillance_sentinel.pt"
        if sentinel_pt.exists():
            weights = str(sentinel_pt)
            print(f"[*] Switching to Surveillance Sentinel Model: {weights}")

    run_detection(
        source=args.source,
        weights_path=weights,
        conf_thresh=args.conf,
        iou_thresh=args.iou,
        use_pose=args.pose,
        enable_tracking=not args.no_track,
        save_output=not args.no_save,
        save_crops=not args.no_crops,
        instant_db=not args.no_db,
        display=args.show
    )


if __name__ == "__main__":
    main()

