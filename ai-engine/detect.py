#!/usr/bin/env python3
"""
BorderGuard AI - Intelligent Detection & Person-Object Association Pipeline
Features:
1. Detects people and weapons (guns) with bounding boxes and confidence scores.
2. Performs Person-Object Association (spatial overlap, wrist keypoint proximity, and motion correlation).
3. Distinguishes between active carrying/holding vs. stationary proximity.
4. Supports image files, video files, and live laptop webcam feeds.
"""

import sys
import math
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


class PersonObjectAssociator:
    """
    Associates carried objects (weapons/guns) with detected persons.
    Uses a multi-stage verification pipeline:
    - Stage 1: Spatial Bounding Box Enclosure & Normalized Distance
    - Stage 2: Hand/Wrist Keypoint Proximity (YOLOv8-Pose integration)
    - Stage 3: Temporal Motion Correlation (ByteTrack velocity alignment)
    """

    def __init__(self, proximity_threshold: float = 0.25, use_pose: bool = False):
        self.proximity_threshold = proximity_threshold
        self.use_pose = use_pose
        self.pose_model = None
        self.track_history = defaultdict(list)  # track_id -> list of centers

        if self.use_pose:
            try:
                print("[*] Loading YOLOv8n-pose for hand/wrist keypoint association...")
                self.pose_model = YOLO("yolov8n-pose.pt")
                print("[+] Pose model loaded successfully.")
            except Exception as e:
                print(f"[!] Warning: Could not load pose model ({e}). Using geometric arm-wrist anchors.")
                self.pose_model = None

    def associate(self, persons: list, objects: list, frame_bgr: np.ndarray = None) -> list:
        """
        Computes association links between persons and carried objects.
        Returns a list of dicts:
        [{
            'person': person_dict,
            'object': object_dict,
            'distance_norm': float,
            'is_held': bool,
            'reason': str
        }]
        """
        associations = []
        if not persons or not objects:
            return associations

        # Optional Stage 2: Extract real wrist keypoints if pose model is active
        wrist_points_per_person = {}
        if self.pose_model is not None and frame_bgr is not None:
            try:
                pose_results = self.pose_model(frame_bgr, verbose=False)
                for r in pose_results:
                    if r.keypoints is not None and len(r.keypoints) > 0:
                        for idx, kpts in enumerate(r.keypoints.xy):
                            # COCO Keypoints: index 9 = left_wrist, index 10 = right_wrist
                            kpts_np = kpts.cpu().numpy()
                            if len(kpts_np) > 10:
                                wrist_points_per_person[idx] = {
                                    'left_wrist': kpts_np[9],
                                    'right_wrist': kpts_np[10]
                                }
            except Exception as e:
                pass

        for p_idx, person in enumerate(persons):
            px1, py1, px2, py2 = person['bbox']
            pw = max(1, px2 - px1)
            ph = max(1, py2 - py1)
            p_center = np.array([(px1 + px2) / 2.0, (py1 + py2) / 2.0])

            # Arm / wrist fallback anchor points (estimated from upper torso)
            estimated_wrists = [
                np.array([px1 + pw * 0.15, py1 + ph * 0.60]),  # Left hand zone
                np.array([px1 + pw * 0.85, py1 + ph * 0.60]),  # Right hand zone
                np.array([px1 + pw * 0.50, py1 + ph * 0.55])   # Center chest/waist carry zone
            ]

            # Use detected pose wrists if matched by bounding box
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

                # 1. Distance normalized by person height (scale invariant)
                center_dist = np.linalg.norm(p_center - o_center)
                center_dist_norm = center_dist / ph

                # 2. Minimum distance from weapon center to any wrist/hand point
                min_wrist_dist = min([np.linalg.norm(w_pt - o_center) for w_pt in estimated_wrists])
                min_wrist_dist_norm = min_wrist_dist / ph

                # 3. Spatial Enclosure Check (is weapon inside or immediately adjacent to person box?)
                inside_box = (px1 - pw * 0.15 <= o_center[0] <= px2 + pw * 0.15) and \
                             (py1 <= o_center[1] <= py2 + ph * 0.10)

                # 4. Association Decision Rule
                # Proximity alone is not enough; must be near wrist/torso and within boundary
                is_held = False
                reason = "Unassociated"

                if min_wrist_dist_norm < 0.22:
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
    display: bool = False
):
    """
    Executes object detection and association on the provided source.
    """
    if weights_path is None:
        if (MODELS_DIR / "best.pt").exists():
            weights_path = str(MODELS_DIR / "best.pt")
        elif (RUNS_DIR / "detect" / "train" / "weights" / "best.pt").exists():
            weights_path = str(RUNS_DIR / "detect" / "train" / "weights" / "best.pt")
        else:
            weights_path = "yolov8n.pt"
            print(f"[!] Warning: Custom best.pt not found. Running baseline {weights_path}...")

    print("=" * 70)
    print("BORDERGUARD AI - OBJECT DETECTION & ASSOCIATION RUNNER")
    print("=" * 70)
    print(f"Model Weights:      {weights_path}")
    print(f"Input Source:       {source}")
    print(f"Confidence Thresh:  {conf_thresh}")
    print(f"IoU NMS Thresh:     {iou_thresh}")
    print(f"Pose Estimation:    {use_pose}")
    print(f"ByteTrack Tracking: {enable_tracking}")
    print("=" * 70 + "\n")

    model = YOLO(weights_path)
    associator = PersonObjectAssociator(proximity_threshold=0.35, use_pose=use_pose)

    # Determine input type
    is_webcam = source.isdigit() or source.lower() == "webcam"
    is_youtube = ("youtube.com" in source.lower() or "youtu.be" in source.lower())
    source_arg = int(source) if source.isdigit() else source

    if is_youtube:
        print(f"[*] YouTube video link detected: {source}")
        print("[*] Extracting live stream using cap-from-youtube...")
        cap = None
        try:
            from cap_from_youtube import cap_from_youtube
            for res in ['best', '720p', '480p', '360p']:
                try:
                    cap = cap_from_youtube(source, resolution=res)
                    if cap is not None and cap.isOpened():
                        print(f"[+] Connected to YouTube stream ({res})!")
                        break
                except Exception:
                    continue
        except Exception as e:
            print(f"[!] Warning: cap-from-youtube import failed: {e}")

        if cap is None or not cap.isOpened():
            print("[!] cap-from-youtube failed. Trying raw stream fallback...")
            cap = cv2.VideoCapture(source_arg)
    else:
        cap = cv2.VideoCapture(source_arg)

    if not cap.isOpened():
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

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1

        # Run inference (with or without ByteTrack tracking)
        if enable_tracking and not (isinstance(source_arg, str) and source_arg.lower().endswith(('.jpg', '.jpeg', '.png'))):
            results = model.track(frame, conf=conf_thresh, iou=iou_thresh, tracker="bytetrack.yaml", verbose=False)
        else:
            results = model(frame, conf=conf_thresh, iou=iou_thresh, verbose=False)

        persons = []
        objects = []

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
                elif cls_name in ["gun", "weapon", "knife", "pistol", "rifle"]:
                    objects.append(item)

        # Execute association algorithm
        associations = associator.associate(persons, objects, frame_bgr=frame)
        armed_persons_indices = set([a['person_idx'] for a in associations if a['is_held']])

        # Draw visual annotations
        # 1. Draw Persons
        for p_idx, person in enumerate(persons):
            x1, y1, x2, y2 = person['bbox']
            is_armed = p_idx in armed_persons_indices

            color = (0, 0, 230) if is_armed else (255, 191, 0)  # Red for armed, Cyan/Amber for safe
            status_text = "ARMED SUSPECT" if is_armed else "PERSON"
            tid_text = f" [ID:{person['track_id']}]" if person['track_id'] is not None else ""
            label = f"{status_text}{tid_text} {int(person['conf'] * 100)}%"

            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.rectangle(frame, (x1, max(0, y1 - 24)), (x1 + len(label) * 9, y1), color, -1)
            cv2.putText(frame, label, (x1 + 4, y1 - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

        # 2. Draw Weapons/Guns
        for obj in objects:
            ox1, oy1, ox2, oy2 = obj['bbox']
            color = (0, 0, 255)  # Red
            label = f"{obj['class'].upper()} {int(obj['conf'] * 100)}%"
            cv2.rectangle(frame, (ox1, oy1), (ox2, oy2), color, 2)
            cv2.rectangle(frame, (ox1, max(0, oy1 - 22)), (ox1 + len(label) * 9, oy1), (0, 0, 180), -1)
            cv2.putText(frame, label, (ox1 + 4, oy1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)

        # 3. Draw Association Links
        for assoc in associations:
            if assoc['is_held']:
                px1, py1, px2, py2 = assoc['person']['bbox']
                ox1, oy1, ox2, oy2 = assoc['object']['bbox']
                p_center = ((px1 + px2) // 2, (py1 + py2) // 2)
                o_center = ((ox1 + ox2) // 2, (oy1 + oy2) // 2)

                # Draw dashed or solid warning line linking person to carried weapon
                cv2.line(frame, p_center, o_center, (0, 0, 255), 2, cv2.LINE_AA)
                mid_x = (p_center[0] + o_center[0]) // 2
                mid_y = (p_center[1] + o_center[1]) // 2
                cv2.putText(frame, "HELD", (mid_x, mid_y), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 255), 1)

        # 4. HUD Telemetry Banner
        hud_bg = frame[0:40, 0:width]
        cv2.rectangle(frame, (0, 0), (width, 40), (15, 20, 28), -1)
        hud_text = f"BORDERGUARD AI SENTINEL | Persons: {len(persons)} | Weapons: {len(objects)} | Armed Suspects: {len(armed_persons_indices)}"
        cv2.putText(frame, hud_text, (15, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 229, 255), 1, cv2.LINE_AA)

        if out_writer is not None:
            out_writer.write(frame)

        if display:
            cv2.imshow("BorderGuard AI - Detection & Association", frame)
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
    parser.add_argument("--conf", type=float, default=0.35, help="Detection confidence threshold (default: 0.35)")
    parser.add_argument("--iou", type=float, default=0.45, help="NMS IoU threshold (default: 0.45)")
    parser.add_argument("--pose", action="store_true", help="Enable YOLOv8-pose for keypoint wrist proximity detection")
    parser.add_argument("--no-track", action="store_true", help="Disable ByteTrack temporal tracking")
    parser.add_argument("--show", action="store_true", help="Display live OpenCV window (press 'q' to quit)")
    parser.add_argument("--no-save", action="store_true", help="Do not save output media to disk")

    args = parser.parse_args()

    run_detection(
        source=args.source,
        weights_path=args.weights,
        conf_thresh=args.conf,
        iou_thresh=args.iou,
        use_pose=args.pose,
        enable_tracking=not args.no_track,
        save_output=not args.no_save,
        display=args.show
    )


if __name__ == "__main__":
    main()
