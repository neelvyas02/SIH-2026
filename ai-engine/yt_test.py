import sys
import os
import subprocess
import time
import argparse
import json
from pathlib import Path
from collections import defaultdict, deque

import cv2
import numpy as np
import torch
from ultralytics import YOLO

BASE = Path(__file__).resolve().parent
MODEL_DIR = BASE / "models"
OUTPUT_DIR = BASE / "runs" / "youtube_tests"
TRACKER_CONFIG = str(MODEL_DIR / "bytetrack.yaml") if (MODEL_DIR / "bytetrack.yaml").exists() else "bytetrack.yaml"

# ANSI Terminal formatting
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"
RESET = "\033[0m"
DIM = "\033[2m"
MAGENTA = "\033[95m"

# ==============================================================================
# 1. STREAMLINED MODEL CATALOG (MODELS 1 & 7 ONLY)
# ==============================================================================
MODEL_CATALOG = [
    {
        "id": 1,
        "name": "YOLO11x Flagship Multi-Object Sentinel + ByteTrack",
        "file": "yolo11x.pt",
        "tag": "SOTA MULTI-OBJECT & CATEGORY SENTINEL",
        "type": "model_1_multi_object",
        "task": "detect_and_classify",
        "classes": "All COCO 80 Classes (Personnel, Vehicles, Gear, Animals, Threats, Electronics, etc.)",
        "fps_gpu": "~65 FPS",
        "desc": "Ultralytics SOTA flagship model with Unique IDs on all objects, full categorical grouping, high-precision count telemetry, and real-time category HUD.",
        "conf_default": 0.35,
        "conf_weapon": 0.50,
    },
    {
        "id": 7,
        "name": "BorderGuard Tactical Weapon & Personnel Threat Sentinel",
        "file": "best.pt",
        "tag": "TACTICAL GUN & PERSONNEL SENTINEL",
        "type": "model_7_tactical_threat",
        "task": "threat_gun_person_separation",
        "classes": "Separated Guns vs People (Smart Non-Colliding Labels & Dedicated Tracking IDs)",
        "fps_gpu": "~180 FPS",
        "desc": "High-precision sentinel with isolated tracking IDs for guns vs people, collision-free label positioning, carrier-threat spatial linking, and instant tactical threat alerts.",
        "conf_default": 0.35,
        "conf_weapon": 0.50,
    },
    {
        "id": 3,
        "name": "BorderGuard Intelligent Perimeter Anomaly & Breach Sentinel",
        "file": "anomaly_sentinel.pt",
        "tag": "PER-PERSON PERIMETER & BREACH SENTINEL",
        "type": "model_3_anomaly_sentinel",
        "task": "perimeter_anomaly_detection",
        "classes": "Suspicious Fence Climbers & Intruders (Normal Spectators Suppressed/Ignored)",
        "fps_gpu": "~75 FPS",
        "desc": "Per-person behavioral & spatial sentinel distinguishing abnormal fence climbers from normal bystanders in crowded border zones. Suppresses innocent crowds and highlights active climbing/breach intruders with tactical reticles and forensic snapshots.",
        "conf_default": 0.25,
        "conf_weapon": 0.50,
    },
]

# ==============================================================================
# 2. COMPREHENSIVE CATEGORY MAPPINGS & COLOR PALETTES FOR COCO 80 CLASSES
# ==============================================================================
CATEGORY_DEFINITIONS = {
    # 1. PERSONNEL / HUMAN
    "person": ("PERSONNEL", (255, 191, 0)),  # Electric Cyan / Azure

    # 2. VEHICLES
    "bicycle": ("VEHICLE", (0, 230, 115)),    # Emerald Green
    "car": ("VEHICLE", (0, 230, 115)),
    "motorcycle": ("VEHICLE", (0, 230, 115)),
    "airplane": ("VEHICLE", (0, 230, 115)),
    "bus": ("VEHICLE", (0, 230, 115)),
    "train": ("VEHICLE", (0, 230, 115)),
    "truck": ("VEHICLE", (0, 230, 115)),
    "boat": ("VEHICLE", (0, 230, 115)),

    # 3. WEAPONS & TACTICAL HAZARDS
    "gun": ("WEAPON / THREAT", (0, 0, 255)),  # Vivid Red
    "pistol": ("WEAPON / THREAT", (0, 0, 255)),
    "rifle": ("WEAPON / THREAT", (0, 0, 255)),
    "firearm": ("WEAPON / THREAT", (0, 0, 255)),
    "knife": ("WEAPON / THREAT", (0, 0, 255)),
    "scissors": ("WEAPON / THREAT", (0, 0, 255)),
    "baseball bat": ("WEAPON / THREAT", (0, 0, 255)),
    "weapon": ("WEAPON / THREAT", (0, 0, 255)),
    "explosive": ("WEAPON / THREAT", (0, 0, 255)),
    "bomb": ("WEAPON / THREAT", (0, 0, 255)),

    # 4. GEAR & BAGGAGE
    "backpack": ("GEAR / BAG", (0, 165, 255)),  # Amber / Warm Orange
    "umbrella": ("GEAR / BAG", (0, 165, 255)),
    "handbag": ("GEAR / BAG", (0, 165, 255)),
    "tie": ("GEAR / BAG", (0, 165, 255)),
    "suitcase": ("GEAR / BAG", (0, 165, 255)),

    # 5. ANIMALS & WILDLIFE
    "bird": ("ANIMAL", (214, 112, 219)),      # Orchid Purple
    "cat": ("ANIMAL", (214, 112, 219)),
    "dog": ("ANIMAL", (214, 112, 219)),
    "horse": ("ANIMAL", (214, 112, 219)),
    "sheep": ("ANIMAL", (214, 112, 219)),
    "cow": ("ANIMAL", (214, 112, 219)),
    "elephant": ("ANIMAL", (214, 112, 219)),
    "bear": ("ANIMAL", (214, 112, 219)),
    "zebra": ("ANIMAL", (214, 112, 219)),
    "giraffe": ("ANIMAL", (214, 112, 219)),

    # 6. ELECTRONICS & COMMS
    "cell phone": ("ELECTRONIC", (250, 206, 135)),  # Sky Teal
    "laptop": ("ELECTRONIC", (250, 206, 135)),
    "mouse": ("ELECTRONIC", (250, 206, 135)),
    "remote": ("ELECTRONIC", (250, 206, 135)),
    "keyboard": ("ELECTRONIC", (250, 206, 135)),
    "tv": ("ELECTRONIC", (250, 206, 135)),
    "microwave": ("ELECTRONIC", (250, 206, 135)),
    "oven": ("ELECTRONIC", (250, 206, 135)),
    "toaster": ("ELECTRONIC", (250, 206, 135)),
    "refrigerator": ("ELECTRONIC", (250, 206, 135)),

    # 7. INFRASTRUCTURE & OUTDOOR
    "traffic light": ("INFRASTRUCTURE", (180, 180, 100)),
    "fire hydrant": ("INFRASTRUCTURE", (180, 180, 100)),
    "stop sign": ("INFRASTRUCTURE", (180, 180, 100)),
    "parking meter": ("INFRASTRUCTURE", (180, 180, 100)),
    "bench": ("INFRASTRUCTURE", (180, 180, 100)),
}

DEFAULT_CATEGORY = ("GENERAL OBJECT", (200, 160, 120))


def get_category_info(class_name: str) -> tuple:
    """Returns (category_name, bgr_color) for any class name."""
    cls_lower = class_name.lower().strip()
    if cls_lower in CATEGORY_DEFINITIONS:
        return CATEGORY_DEFINITIONS[cls_lower]
    for key, val in CATEGORY_DEFINITIONS.items():
        if key in cls_lower:
            return val
    return DEFAULT_CATEGORY


def compute_iou(box_a, box_b) -> float:
    """Computes IoU between two boxes [x1, y1, x2, y2]."""
    xa = max(box_a[0], box_b[0])
    ya = max(box_a[1], box_b[1])
    xb = min(box_a[2], box_b[2])
    yb = min(box_a[3], box_b[3])
    inter = max(0, xb - xa) * max(0, yb - ya)
    if inter == 0:
        return 0.0
    area_a = max(0, box_a[2] - box_a[0]) * max(0, box_a[3] - box_a[1])
    area_b = max(0, box_b[2] - box_b[0]) * max(0, box_b[3] - box_b[1])
    union = float(area_a + area_b - inter)
    return inter / union if union > 0 else 0.0


class TrackIdManager:
    """
    Maintains clean, continuous unique tracking IDs across frames.
    Uses ByteTrack native track IDs when available, and provides spatial IoU fallback
    matching to ensure EVERY single detected box ALWAYS displays a valid Unique ID.
    """
    def __init__(self, prefix: str = "", start_fallback_id: int = 5001):
        self.prefix = prefix
        self.fallback_counter = start_fallback_id
        self.prev_tracks = []  # list of (box, id, class_name)

    def assign_ids(self, detections: list) -> list:
        """
        detections: list of dicts with 'bbox', 'conf', 'class', 'raw_track_id'
        Returns updated detections with guaranteed 'track_id' and 'formatted_id'.
        """
        assigned = []
        unassigned_dets = []

        # Step 1: Assign direct ByteTrack IDs
        for det in detections:
            raw_id = det.get("raw_track_id")
            if raw_id is not None:
                tid = int(raw_id)
                det["track_id"] = tid
                det["formatted_id"] = f"{self.prefix}{tid}"
                assigned.append(det)
            else:
                unassigned_dets.append(det)

        # Step 2: Fallback IoU spatial matching with previous frame tracks
        for det in unassigned_dets:
            matched_id = None
            best_iou = 0.30
            for p_box, p_id, p_cls in self.prev_tracks:
                if p_cls == det["class"]:
                    iou_val = compute_iou(det["bbox"], p_box)
                    if iou_val > best_iou:
                        best_iou = iou_val
                        matched_id = p_id

            if matched_id is None:
                matched_id = self.fallback_counter
                self.fallback_counter += 1

            det["track_id"] = matched_id
            det["formatted_id"] = f"{self.prefix}{matched_id}"
            assigned.append(det)

        # Update previous tracks for next frame
        self.prev_tracks = [(d["bbox"], d["track_id"], d["class"]) for d in assigned]
        return assigned


def evaluate_perimeter_threat(box, frame_w, frame_h, pose_kpts=None):
    """
    Per-Person Behavioral & Spatial Perimeter Sentinel Evaluation.
    Evaluates individual spatial ground elevation, barrier proximity, aspect ratio,
    perspective road depth, and climbing kinematics to separate normal crowd bystanders
    from active intruders.
    """
    x1, y1, x2, y2 = box
    bw = max(1, x2 - x1)
    bh = max(1, y2 - y1)
    aspect = bh / float(bw)
    xc = (x1 + x2) / 2.0
    yc = (y1 + y2) / 2.0

    # 1. Perspective Roadway Rejection Filter:
    # On the right-hand roadway (xc > 460), upright pedestrians walking in the distance
    # appear high in the frame due to perspective vanishing depth.
    # If they are on the roadway, small, and upright, they are normal pedestrians outside the barrier.
    if xc > (frame_w * 0.72) and aspect > 1.70 and bh < (frame_h * 0.22):
        return False, "NORMAL_SPECTATOR", 0.0, ["Distant road pedestrian"]

    # 2. Dynamic Ground Baseline Estimation for Perimeter View:
    # Ground roadway plane slopes from mid-left (~0.65 H) down to mid-right (~0.81 H).
    expected_ground_y = (frame_h * 0.65) + (xc / float(frame_w)) * (frame_h * 0.16)

    # Ground clearance / elevation lift (positive = lifted into the air/fence):
    lift_off_ground = expected_ground_y - y2

    threat_score = 0.0
    reasons = []

    # Criterion 1: Significant Elevation on Perimeter Barrier / Fence
    # Intruders climbing or scaling wire posts have feet clearly off the ground plane
    if lift_off_ground > (frame_h * 0.09) and y1 < (frame_h * 0.52) and xc < (frame_w * 0.80):
        elevation_weight = min(0.55, 0.35 + (lift_off_ground / float(frame_h)) * 0.80)
        threat_score += elevation_weight
        reasons.append(f"Elevated on barrier (+{int(lift_off_ground)}px off ground)")

    # Criterion 2: Climbing / Straddling / Vaulting Aspect Ratio
    # Upright walking pedestrians have H/W in [1.8, 3.8].
    # Intruders vaulting or hanging horizontally across top fence wires have distorted aspect ratio (H/W < 1.55)
    if aspect < 1.55 and y2 < expected_ground_y - 25 and lift_off_ground > (frame_h * 0.05) and xc < (frame_w * 0.82):
        threat_score += 0.35
        reasons.append(f"Climbing / vaulting silhouette (aspect {aspect:.2f})")

    # Criterion 3: Near Apex of Fence Structure
    # Top of head positioned near apex of fence line (y1 < 0.38 of frame height)
    if y1 < (frame_h * 0.38) and xc < (frame_w * 0.80) and y2 < (expected_ground_y - 20):
        threat_score += 0.30
        reasons.append("Intruder near fence apex")

    # Criterion 4: Pose Keypoint Kinematics (Overhead Wire Grasp)
    if pose_kpts is not None and len(pose_kpts) >= 11:
        # COCO Keypoints: 5,6=shoulders, 9,10=wrists, 0=nose
        wrists_y = [pose_kpts[j][1] for j in [9, 10] if pose_kpts[j][2] > 0.25]
        shoulders_y = [pose_kpts[j][1] for j in [5, 6] if pose_kpts[j][2] > 0.25]
        if wrists_y and shoulders_y and min(wrists_y) < min(shoulders_y) and lift_off_ground > 15:
            threat_score += 0.35
            reasons.append("Overhead wire grasp keypoints")

    threat_score = min(0.99, threat_score)
    is_suspicious = threat_score >= 0.50
    threat_type = "FENCE_CLIMBER" if is_suspicious else "NORMAL_SPECTATOR"
    return is_suspicious, threat_type, threat_score, reasons


def draw_styled_badge(
    img: np.ndarray,
    text: str,
    x: int,
    y: int,
    bg_color: tuple,
    text_color: tuple = (255, 255, 255),
    font_scale: float = None,
    thickness: int = 1,
    position: str = "above",  # "above", "below", "right", "inside"
    box_coords: tuple = None,
    ui_scale: float = 1.0,
    top_limit: int = 0,
    bottom_limit: int = None,
):
    """
    Renders a resolution-adaptive, proportional telemetry badge with solid background.
    Automatically scales font and padding according to video resolution so labels never
    dwarf the video or obscure surrounding content, and cleanly respects HUD limits.
    """
    h_frame, w_frame = img.shape[:2]
    bot_bound = (h_frame - bottom_limit) if bottom_limit is not None else h_frame
    top_bound = top_limit

    # Adaptive font scaling proportional to video resolution
    if font_scale is None:
        font_scale = float(np.clip(0.42 * ui_scale, 0.24, 0.52))

    font = cv2.FONT_HERSHEY_SIMPLEX
    (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)

    pad_x = max(2, int(round(4 * ui_scale)))
    pad_y = max(1, int(round(2 * ui_scale)))
    badge_w = text_w + pad_x * 2
    badge_h = text_h + baseline + pad_y * 2

    bx1, by1, bx2, by2 = box_coords if box_coords is not None else (x, y, x + 50, y + 50)

    if position == "above":
        rx1 = bx1
        ry1 = by1 - badge_h
        # If clipping into top banner, place below or inside
        if ry1 < top_bound:
            ry1 = min(bot_bound - badge_h, by1 + 2)
    elif position == "below":
        rx1 = bx1
        ry1 = by2 + 2
        # If clipping into bottom status bar, place above or inside
        if ry1 + badge_h > bot_bound:
            ry1 = max(top_bound, by1 - badge_h)
    elif position == "right":
        rx1 = bx2 + 4
        ry1 = by1
    else:  # inside
        rx1 = bx1 + 2
        ry1 = min(bot_bound - badge_h, by1 + 2)

    # Shift horizontally to stay fully within video frame boundaries
    if rx1 + badge_w > w_frame:
        rx1 = max(0, w_frame - badge_w - 2)
    rx1 = max(0, rx1)
    ry1 = max(top_bound, min(bot_bound - badge_h, ry1))

    rx2 = min(w_frame - 1, rx1 + badge_w)
    ry2 = min(bot_bound - 1, ry1 + badge_h)

    # Draw solid background badge with subtle outline
    cv2.rectangle(img, (rx1, ry1), (rx2, ry2), bg_color, -1)
    cv2.rectangle(img, (rx1, ry1), (rx2, ry2), (255, 255, 255), 1)

    # Draw text cleanly with scaled baseline
    tx = rx1 + pad_x
    ty = ry1 + text_h + pad_y
    cv2.putText(img, text, (tx, ty), font, font_scale, text_color, thickness, cv2.LINE_AA)
    return (rx1, ry1, rx2, ry2)


# ==============================================================================
# 3. BREACH ACTIVITIES & FORENSIC EVIDENCE HARVEST SENTINEL
# ==============================================================================
BREACH_CLASSES = {
    "burglary", "robbery", "stealing", "fighting",
    "assault", "shooting", "arson", "vandalism", "shoplifting", "abuse"
}


class EvidenceHarvestManager:
    """
    Forensic Evidence & Snapshot Harvest Manager for BorderGuard AI.
    Features:
    1. Automated Run Package Hierarchy:
       runs/youtube_tests/<model_stem>_<timestamp>/
         ├── tested_model_stream.mp4
         ├── abnormal_activity_highlight.mp4 (if anomaly/breach occurs)
         ├── incident_report.json
         └── snapshots/
             ├── caught_in_abnormal_activity/
             │   ├── suspect_caught_best_angle_full.jpg
             │   ├── suspect_caught_face.jpg
             │   └── suspect_caught_body.jpg
             └── all_persons/
                 ├── faces/person_<ID>_face.jpg
                 └── bodies/person_<ID>_body.jpg
    2. Best Angle Quality Scoring:
       Evaluates area, person conf, face keypoints visibility (nose/eyes vs ears/back),
       aspect ratio, and anomaly/breach severity to identify the absolute best forensic angle.
    3. Facial Version Generation:
       Extracts face using keypoints 0-4 with anatomical fallback; upscales small crops with
       cv2.INTER_CUBIC and subtle unsharp sharpening to min 160x160 for crystal-clear facial identification.
    4. Forensic Stamped Stills:
       Generates official stamped forensic still with red breach/abnormal headers, targeting brackets,
       on-suspect label '[! CAUGHT IN ABNORMAL ACTIVITY: <TYPE> !]' or '[! CAUGHT IN BREACH ACTIVITY: <TYPE> !]',
       and telemetry audit footer with timestamp and angle score.
    5. Highlight Video Generation:
       Maintains a rolling buffer to extract a 5-15s highlight clip around the anomaly/breach incident.
    """
    def __init__(self, run_dir: Path, model_name: str, fps: float = 25.0, device: str = "cuda"):
        self.run_dir = Path(run_dir)
        self.model_name = model_name
        self.fps = fps if fps > 1.0 else 25.0
        self.device = device

        # Subdirectories
        self.snapshots_dir = self.run_dir / "snapshots"
        self.caught_dir = self.snapshots_dir / "caught_in_abnormal_activity"
        self.all_faces_dir = self.snapshots_dir / "all_persons" / "faces"
        self.all_bodies_dir = self.snapshots_dir / "all_persons" / "bodies"

        for d in [self.caught_dir, self.all_faces_dir, self.all_bodies_dir]:
            d.mkdir(parents=True, exist_ok=True)

        # Pose model for keypoint extraction (prioritize higher accuracy yolov8x-pose if available)
        pose_path = MODEL_DIR / "yolov8x-pose.pt"
        if not pose_path.exists():
            pose_path = MODEL_DIR / "yolov8n-pose.pt"
        self.pose_model = None
        if pose_path.exists():
            try:
                self.pose_model = YOLO(str(pose_path))
            except Exception:
                self.pose_model = None

        # Best suspect caught in abnormal/breach activity
        self.best_suspect = None

        # All persons tracked: person_id -> best_record
        self.all_persons = {}

        # Highlight recording buffer
        self.pre_buffer = deque(maxlen=int(self.fps * 2.5))  # ~2.5s pre-event buffer
        self.highlight_frames = []
        self.is_recording_highlight = False
        self.max_highlight_frames = int(self.fps * 10)  # Max ~10s highlight

        # Telemetry & incidents log
        self.incidents = []

    def evaluate_angle_quality(self, bbox, frame_shape, conf, keypoints=None, is_suspect=False, anomaly_conf=0.0, is_breach=False):
        fh, fw = frame_shape[:2]
        x1, y1, x2, y2 = bbox
        pw = max(1, x2 - x1)
        ph = max(1, y2 - y1)

        # 1. Size / Area score (up to 30 pts)
        area_ratio = (pw * ph) / float(fw * fh)
        area_score = min(30.0, (area_ratio / 0.15) * 30.0)

        # 2. Detection confidence (up to 20 pts)
        conf_score = min(20.0, float(conf) * 20.0)

        # 3. Aspect ratio score (penalize extreme shapes)
        aspect = ph / float(pw)
        aspect_score = 15.0
        if aspect < 1.2 or aspect > 3.8:
            aspect_score = max(0.0, 15.0 - abs(aspect - 2.2) * 5.0)

        # 4. Facial keypoint orientation bonus (up to 35 pts)
        face_score = 5.0  # baseline fallback
        if keypoints is not None and len(keypoints) >= 5:
            # 0: nose, 1: left eye, 2: right eye, 3: left ear, 4: right ear
            nose = keypoints[0]
            l_eye = keypoints[1]
            r_eye = keypoints[2]
            l_ear = keypoints[3]
            r_ear = keypoints[4]

            eyes_visible = (l_eye[2] > 0.35 and r_eye[2] > 0.35)
            nose_visible = (nose[2] > 0.35)

            if eyes_visible and nose_visible:
                # Direct frontal face view - supreme forensic angle!
                face_score = 35.0
            elif nose_visible and (l_eye[2] > 0.3 or r_eye[2] > 0.3):
                # Three-quarter angle
                face_score = 26.0
            elif l_ear[2] > 0.35 and r_ear[2] > 0.35:
                # Profile or rear
                face_score = 12.0
            else:
                face_score = 8.0

        total_score = area_score + conf_score + aspect_score + face_score

        # 5. Incident severity bonus (Suspicious fence climbers / intruders strictly outrank normal bystanders)
        if is_suspect:
            total_score += 100.0 + float(anomaly_conf) * 30.0
            if is_breach:
                total_score += 30.0

        return round(float(total_score), 2)

    def extract_face_crop(self, frame, bbox, keypoints=None):
        fh, fw = frame.shape[:2]
        x1, y1, x2, y2 = bbox
        pw = max(1, x2 - x1)
        ph = max(1, y2 - y1)

        face_kpts = []
        if keypoints is not None and len(keypoints) >= 5:
            face_kpts = [k for k in keypoints[:5] if k[2] > 0.25]

        if len(face_kpts) >= 2:
            xs = [k[0] for k in face_kpts]
            ys = [k[1] for k in face_kpts]
            cx, cy = float(np.mean(xs)), float(np.mean(ys))
            head_size = max(pw * 0.45, ph * 0.25, 24.0)
        else:
            # Anatomical fallback: head is in upper 25% of body box
            head_size = max(pw * 0.52, ph * 0.26, 24.0)
            cx = (x1 + x2) / 2.0
            cy = y1 + head_size * 0.45

        fx1 = max(0, int(cx - head_size * 0.65))
        fx2 = min(fw, int(cx + head_size * 0.65))
        fy1 = max(0, int(cy - head_size * 0.70))
        fy2 = min(fh, int(cy + head_size * 0.70))

        crop = frame[fy1:fy2, fx1:fx2]
        if crop.size == 0 or crop.shape[0] < 5 or crop.shape[1] < 5:
            return None

        # Super-resolution / clean cubic upscale for forensic clarity
        ch, cw = crop.shape[:2]
        if max(ch, cw) < 160:
            scale_f = 160.0 / float(max(ch, cw))
            target_w = max(16, int(round(cw * scale_f)))
            target_h = max(16, int(round(ch * scale_f)))
            crop = cv2.resize(crop, (target_w, target_h), interpolation=cv2.INTER_CUBIC)
            # Subtle unsharp mask
            blur = cv2.GaussianBlur(crop, (0, 0), 1.5)
            crop = cv2.addWeighted(crop, 1.25, blur, -0.25, 0)

        return crop

    def extract_body_crop(self, frame, bbox):
        fh, fw = frame.shape[:2]
        x1, y1, x2, y2 = bbox
        bx1 = max(0, x1)
        by1 = max(0, y1)
        bx2 = min(fw, x2)
        by2 = min(fh, y2)
        crop = frame[by1:by2, bx1:bx2]
        return crop if crop.size > 0 else None

    def record_person_frame(
        self,
        person_id: str,
        unannotated_frame: np.ndarray,
        bbox: tuple,
        conf: float,
        is_suspect: bool = False,
        activity_name: str = "NORMAL",
        is_breach: bool = False,
        anomaly_conf: float = 0.0,
        frame_idx: int = 0,
        keypoints: np.ndarray = None,
    ):
        score = self.evaluate_angle_quality(
            bbox=bbox,
            frame_shape=unannotated_frame.shape,
            conf=conf,
            keypoints=keypoints,
            is_suspect=is_suspect,
            anomaly_conf=anomaly_conf,
            is_breach=is_breach,
        )

        face_crop = self.extract_face_crop(unannotated_frame, bbox, keypoints=keypoints)
        body_crop = self.extract_body_crop(unannotated_frame, bbox)

        # 1. Update all persons best record
        if person_id not in self.all_persons or score > self.all_persons[person_id]["score"]:
            self.all_persons[person_id] = {
                "person_id": person_id,
                "score": score,
                "bbox": bbox,
                "conf": conf,
                "frame_idx": frame_idx,
                "face_crop": face_crop.copy() if face_crop is not None else None,
                "body_crop": body_crop.copy() if body_crop is not None else None,
            }

        # 2. Update best suspect caught in abnormal/breach activity
        if is_suspect:
            if self.best_suspect is None or score > self.best_suspect["score"]:
                self.best_suspect = {
                    "person_id": person_id,
                    "score": score,
                    "bbox": bbox,
                    "conf": conf,
                    "activity_name": activity_name,
                    "is_breach": is_breach,
                    "anomaly_conf": anomaly_conf,
                    "frame_idx": frame_idx,
                    "unannotated_frame": unannotated_frame.copy(),
                    "face_crop": face_crop.copy() if face_crop is not None else None,
                    "body_crop": body_crop.copy() if body_crop is not None else None,
                    "timestamp_str": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
                }

            self.incidents.append({
                "frame_idx": frame_idx,
                "person_id": person_id,
                "activity": activity_name,
                "is_breach": is_breach,
                "conf": float(anomaly_conf or conf),
                "angle_score": score,
            })

    def buffer_annotated_frame(self, annotated_frame: np.ndarray, is_event_active: bool):
        if is_event_active:
            if not self.is_recording_highlight:
                self.is_recording_highlight = True
                self.highlight_frames.extend(self.pre_buffer)
                self.pre_buffer.clear()
            if len(self.highlight_frames) < self.max_highlight_frames:
                self.highlight_frames.append(annotated_frame.copy())
        else:
            if not self.is_recording_highlight:
                self.pre_buffer.append(annotated_frame.copy())
            elif len(self.highlight_frames) < self.max_highlight_frames:
                # Add trailing context frames after event
                self.highlight_frames.append(annotated_frame.copy())

    def generate_stamped_evidence(self, suspect_rec: dict) -> np.ndarray:
        frame = suspect_rec["unannotated_frame"].copy()
        h, w = frame.shape[:2]
        px1, py1, px2, py2 = suspect_rec["bbox"]
        is_breach = suspect_rec.get("is_breach", False)
        activity_name = suspect_rec.get("activity_name", "UNKNOWN")
        person_id = suspect_rec.get("person_id", "SUSPECT")
        conf = suspect_rec.get("anomaly_conf", 0.90)
        score = suspect_rec.get("score", 0.0)
        timestamp_str = suspect_rec.get("timestamp_str", time.strftime("%Y-%m-%d %H:%M:%S UTC"))

        ui_scale = float(np.clip(min(w / 1280.0, h / 720.0), 0.32, 1.35))

        # 1. Top Header Banner
        header_h = int(np.clip(h * 0.08, 22, 55))
        cv2.rectangle(frame, (0, 0), (w, header_h), (0, 0, 190) if is_breach else (0, 70, 210), -1)
        header_title = "[! PERIMETER BREACH EVIDENCE - SUSPECT CAUGHT IN THE ACT !]" if is_breach else "[! FORENSIC EVIDENCE - SUSPECT CAUGHT IN ABNORMAL ACTIVITY !]"
        cv2.putText(
            frame,
            header_title,
            (max(6, int(10 * ui_scale)), int(header_h * 0.68)),
            cv2.FONT_HERSHEY_SIMPLEX,
            np.clip(0.52 * ui_scale, 0.28, 0.65),
            (255, 255, 255),
            2 if ui_scale > 0.8 else 1,
            cv2.LINE_AA,
        )

        # 2. Suspect Targeting Reticle
        box_color = (0, 0, 255) if is_breach else (0, 69, 255)
        th = max(2, int(round(2.4 * ui_scale)))
        cv2.rectangle(frame, (px1, py1), (px2, py2), box_color, th)

        bracket_w = min(int(14 * ui_scale), max(4, (px2 - px1) // 4))
        bracket_h = min(int(14 * ui_scale), max(4, (py2 - py1) // 4))
        if bracket_w > 4:
            cv2.line(frame, (px1, py1), (px1 + bracket_w, py1), (255, 255, 255), th + 1)
            cv2.line(frame, (px1, py1), (px1, py1 + bracket_h), (255, 255, 255), th + 1)
            cv2.line(frame, (px2, py1), (px2 - bracket_w, py1), (255, 255, 255), th + 1)
            cv2.line(frame, (px2, py1), (px2, py1 + bracket_h), (255, 255, 255), th + 1)
            cv2.line(frame, (px1, py2), (px1 + bracket_w, py2), (255, 255, 255), th + 1)
            cv2.line(frame, (px1, py2), (px1, py2 - bracket_h), (255, 255, 255), th + 1)
            cv2.line(frame, (px2, py2), (px2 - bracket_w, py2), (255, 255, 255), th + 1)
            cv2.line(frame, (px2, py2), (px2, py2 - bracket_h), (255, 255, 255), th + 1)

        # 3. Direct Label on Suspect
        caught_tag = f"[! CAUGHT IN BREACH ACTIVITY: {activity_name.upper()} !]" if is_breach else f"[! CAUGHT IN ABNORMAL ACTIVITY: {activity_name.upper()} !]"
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_s = np.clip(0.40 * ui_scale, 0.24, 0.50)
        (tw, th_box), base = cv2.getTextSize(caught_tag, font, font_s, 1)
        bx1 = max(0, min(w - tw - 8, px1))
        by1 = max(header_h + 2, py1 - th_box - 8)
        cv2.rectangle(frame, (bx1, by1), (bx1 + tw + 8, by1 + th_box + base + 4), box_color, -1)
        cv2.rectangle(frame, (bx1, by1), (bx1 + tw + 8, by1 + th_box + base + 4), (255, 255, 255), 1)
        cv2.putText(frame, caught_tag, (bx1 + 4, by1 + th_box + 2), font, font_s, (255, 255, 255), 1, cv2.LINE_AA)

        # 4. Bottom Audit Footer
        footer_h = int(np.clip(h * 0.08, 22, 50))
        cv2.rectangle(frame, (0, h - footer_h), (w, h), (12, 16, 22), -1)
        footer_text = f"TARGET: {person_id} | ACTIVITY: {activity_name.upper()} ({int(conf*100)}%) | BEST ANGLE SCORE: {score:.1f} | {timestamp_str}"
        cv2.putText(
            frame,
            footer_text,
            (max(6, int(10 * ui_scale)), h - int(footer_h * 0.35)),
            font,
            np.clip(0.36 * ui_scale, 0.22, 0.44),
            (0, 229, 255),
            1,
            cv2.LINE_AA,
        )
        return frame

    def finalize(self):
        saved_files = {
            "caught_stamped_full": None,
            "caught_face": None,
            "caught_body": None,
            "all_persons_faces": [],
            "all_persons_bodies": [],
            "highlight_video": None,
            "incident_report": None,
        }

        # 1. Save Best Suspect Caught in Abnormal / Breach Activity
        if self.best_suspect is not None:
            stamped_img = self.generate_stamped_evidence(self.best_suspect)
            stamped_path = self.caught_dir / "suspect_caught_best_angle_full.jpg"
            cv2.imwrite(str(stamped_path), stamped_img)
            saved_files["caught_stamped_full"] = str(stamped_path.resolve())

            if self.best_suspect["face_crop"] is not None:
                face_path = self.caught_dir / "suspect_caught_face.jpg"
                cv2.imwrite(str(face_path), self.best_suspect["face_crop"])
                saved_files["caught_face"] = str(face_path.resolve())

            if self.best_suspect["body_crop"] is not None:
                body_path = self.caught_dir / "suspect_caught_body.jpg"
                cv2.imwrite(str(body_path), self.best_suspect["body_crop"])
                saved_files["caught_body"] = str(body_path.resolve())

        # 2. Save Snapshots of ALL Persons (Faces and Bodies)
        import re
        for p_id, rec in self.all_persons.items():
            raw_id = str(p_id)
            clean_str = re.sub(r'[^a-zA-Z0-9]+', '_', raw_id).strip('_').lower()
            if not clean_str:
                safe_id = f"person_{rec['frame_idx']}"
            elif not clean_str.startswith("person"):
                safe_id = f"person_{clean_str}"
            else:
                safe_id = clean_str

            if rec["face_crop"] is not None:
                p_face_path = self.all_faces_dir / f"{safe_id}_face.jpg"
                cv2.imwrite(str(p_face_path), rec["face_crop"])
                saved_files["all_persons_faces"].append(str(p_face_path.resolve()))

            if rec["body_crop"] is not None:
                p_body_path = self.all_bodies_dir / f"{safe_id}_body.jpg"
                cv2.imwrite(str(p_body_path), rec["body_crop"])
                saved_files["all_persons_bodies"].append(str(p_body_path.resolve()))

        # 3. Save Highlight Video Clip
        if self.highlight_frames:
            hl_path = self.run_dir / "abnormal_activity_highlight.mp4"
            h_h, h_w = self.highlight_frames[0].shape[:2]
            hl_writer = cv2.VideoWriter(
                str(hl_path),
                cv2.VideoWriter_fourcc(*"mp4v"),
                self.fps,
                (h_w, h_h),
            )
            for f in self.highlight_frames:
                hl_writer.write(f)
            hl_writer.release()
            saved_files["highlight_video"] = str(hl_path.resolve())

        # 4. Save Incident Report JSON
        report_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "model": self.model_name,
            "total_persons_tracked": len(self.all_persons),
            "suspect_caught": (self.best_suspect is not None),
            "suspect_details": {
                "person_id": self.best_suspect["person_id"],
                "activity": self.best_suspect["activity_name"],
                "is_breach": self.best_suspect["is_breach"],
                "best_angle_score": self.best_suspect["score"],
                "confidence": float(self.best_suspect["anomaly_conf"]),
                "frame_idx": self.best_suspect["frame_idx"],
            } if self.best_suspect is not None else None,
            "snapshots_harvested": {
                "caught_full_stamped": saved_files["caught_stamped_full"],
                "caught_face": saved_files["caught_face"],
                "caught_body": saved_files["caught_body"],
                "total_person_faces": len(saved_files["all_persons_faces"]),
                "total_person_bodies": len(saved_files["all_persons_bodies"]),
            },
            "highlight_video": saved_files["highlight_video"],
            "all_incident_events_count": len(self.incidents),
        }
        report_path = self.run_dir / "incident_report.json"
        with open(report_path, "w") as f:
            json.dump(report_data, f, indent=2)
        saved_files["incident_report"] = str(report_path.resolve())

        return saved_files


def print_banner():
    print(f"\n{CYAN}{BOLD}===================================================================================================={RESET}")
    print(f"{CYAN}{BOLD}              BORDERGUARD AI - REAL-TIME SENTINEL & MODEL EVALUATION BENCHMARK                      {RESET}")
    print(f"{CYAN}{BOLD}===================================================================================================={RESET}")


def select_model_interactive():
    print_banner()
    print(f"{YELLOW}Available Sentinel Models in 'models/':{RESET}\n")

    available_items = []
    for item in MODEL_CATALOG:
        m_path = MODEL_DIR / item["file"]
        status_str = f"{GREEN}[INSTALLED]{RESET}" if m_path.exists() else f"{RED}[MISSING]{RESET}"
        if m_path.exists():
            available_items.append((item["id"], item, m_path))

        print(f" {BOLD}{item['id']:2d}.{RESET} {CYAN}{item['name']:<58}{RESET} {status_str} | Tag: {BOLD}{item['tag']:<26}{RESET} | Speed: {item['fps_gpu']}")
        print(f"     └─ {DIM}Target Classes:{RESET} {item['classes']}")
        print(f"     └─ {DIM}Description:{RESET}    {item['desc']}\n")

    print(f" {BOLD} Q.{RESET} {RED}Quit{RESET}\n")

    while True:
        choice = input(f"{BOLD}Select model ([1] for Model 1, [7] for Model 7, [3] for Anomaly Sentinel, [Q] to quit): {RESET}").strip().lower()

        if choice in ["q", "quit", "exit"]:
            sys.exit(0)

        if choice in ["1", "model 1", "yolo11x", "yolo11x.pt"]:
            return MODEL_DIR / MODEL_CATALOG[0]["file"], MODEL_CATALOG[0]
        elif choice in ["7", "2", "model 7", "threat", "best", "best.pt"]:
            return MODEL_DIR / MODEL_CATALOG[1]["file"], MODEL_CATALOG[1]
        elif choice in ["3", "model 3", "anomaly", "ucf", "anomaly_sentinel.pt", "best_anomaly.pt"]:
            return MODEL_DIR / MODEL_CATALOG[2]["file"], MODEL_CATALOG[2]

        print(f"{RED}Invalid selection. Please enter 1 (Model 1), 7 (Model 7), or 3 (Anomaly Sentinel).{RESET}")


from urllib.parse import urlparse, parse_qs


def sanitize_youtube_url(url: str) -> str:
    """
    Strips playlist IDs (&list=...) from YouTube URLs to prevent yt-dlp from
    processing an entire playlist, ensuring instantaneous single-video stream resolution.
    """
    try:
        parsed = urlparse(url)
        if "youtu.be" in parsed.netloc:
            video_id = parsed.path.strip("/")
            return f"https://www.youtube.com/watch?v={video_id}"
        if "youtube.com" in parsed.netloc:
            qs = parse_qs(parsed.query)
            if "v" in qs:
                video_id = qs["v"][0]
                return f"https://www.youtube.com/watch?v={video_id}"
    except Exception:
        pass
    return url


def get_stream_url(youtube_url: str) -> str:
    clean_url = sanitize_youtube_url(youtube_url)
    if clean_url != youtube_url:
        print(f"[*] Isolated target video from playlist: {clean_url}")

    formats = [
        "bv*[vcodec^=avc1][ext=mp4]/b[ext=mp4]",
        "18",
        "best[ext=mp4]/best",
    ]

    last_error = None
    for fmt in formats:
        try:
            result = subprocess.run(
                ["yt-dlp", "--no-warnings", "--no-playlist", "-g", "-f", fmt, clean_url],
                capture_output=True,
                text=True,
                timeout=30,
                check=True,
            )
            url_lines = [line.strip() for line in result.stdout.strip().splitlines() if line.strip().startswith("http")]
            if url_lines:
                return url_lines[0]
        except Exception as exc:
            last_error = exc

    raise RuntimeError(f"Could not extract playable YouTube stream: {last_error}")


def parse_arguments():
    parser = argparse.ArgumentParser(description="BorderGuard AI YouTube Video Model Tester (Models 1, 7 & 3 Anomaly)")
    parser.add_argument("url", nargs="?", type=str, help="YouTube video URL or local video path")
    parser.add_argument("model_arg", nargs="?", type=str, help="Model choice: '1' (Multi-Object), '7' (Tactical Threat), '3' (Anomaly Sentinel)")
    parser.add_argument("conf_arg", nargs="?", type=float, help="Confidence threshold (optional)")

    parser.add_argument("--model", "-m", type=str, default=None, help="Model choice: '1', '7', or '3'")
    parser.add_argument("--conf", "-c", type=float, default=None, help="Confidence threshold (0.01 to 0.99)")
    parser.add_argument("--stride", "-s", type=int, default=2, help="Frame stride/skip for fast testing (default: 2 = 2x speedup)")
    parser.add_argument("--scale", type=float, default=1.0, help="Resolution scale factor, e.g. 0.75 or 0.5 (default: 1.0)")
    parser.add_argument("--fast", action="store_true", help="Ultra-fast mode preset (stride=3, scale=0.75, no live window)")
    parser.add_argument("--no-show", action="store_true", help="Disable live OpenCV window display")

    args = parser.parse_args()

    if args.fast:
        args.stride = 3
        args.scale = 0.75
        args.no_show = True

    if args.url:
        youtube_url = args.url.strip().strip('"').strip("'")
        model_str = args.model or args.model_arg or "1"
        conf = args.conf or args.conf_arg

        # Strict validation: Only Model 1, Model 7, and Model 3 are allowed
        if model_str.lower() in ["1", "model 1", "yolo11x", "yolo11x.pt"]:
            meta = MODEL_CATALOG[0]
            m_path = MODEL_DIR / meta["file"]
        elif model_str.lower() in ["7", "2", "model 7", "threat", "best", "best.pt"]:
            meta = MODEL_CATALOG[1]
            m_path = MODEL_DIR / meta["file"]
        elif model_str.lower() in ["3", "model 3", "anomaly", "ucf", "anomaly_sentinel.pt", "best_anomaly.pt"]:
            meta = MODEL_CATALOG[2]
            m_path = MODEL_DIR / meta["file"]
        else:
            print(f"\n{RED}{BOLD}ERROR: yt_test.py supports Model 1, Model 7, and Model 3 (Anomaly Sentinel).{RESET}")
            print(f"Invalid model specified: '{model_str}'. Please select 1, 7, or 3.\n")
            sys.exit(1)

        conf = conf or meta.get("conf_default", 0.35)
        return youtube_url, m_path, meta, conf, args.stride, args.scale, not args.no_show

    # Interactive Mode
    print_banner()
    youtube_url = input(f"\n{BOLD}Enter YouTube Video URL or Video File Path: {RESET}").strip().strip('"').strip("'")
    if not youtube_url:
        raise ValueError("Video source cannot be empty.")

    m_path, meta = select_model_interactive()

    default_conf = meta.get("conf_default", 0.35)
    while True:
        raw_conf = input(f"\n{BOLD}Detection Confidence Threshold [default {default_conf}]: {RESET}").strip()
        if not raw_conf:
            confidence = default_conf
            break
        try:
            confidence = float(raw_conf)
            if 0.0 < confidence < 1.0:
                break
        except ValueError:
            pass
        print(f"{RED}Enter a number between 0 and 1, e.g. 0.35{RESET}")

    while True:
        raw_stride = input(f"{BOLD}Frame Stride / Speed factor (1=Full FPS, 2=2x Speed, 3=3x Speed) [default {args.stride}]: {RESET}").strip()
        if not raw_stride:
            stride = args.stride
            break
        try:
            stride = int(raw_stride)
            if stride >= 1:
                break
        except ValueError:
            pass
        print(f"{RED}Enter a positive integer >= 1.{RESET}")

    show_window = not args.no_show
    return youtube_url, m_path, meta, confidence, stride, args.scale, show_window


def main():
    youtube_url, model_path, meta, confidence, stride, scale, show_display = parse_arguments()

    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found at: {model_path}")

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model_type = meta.get("type", "model_1_multi_object")
    weapon_conf_thresh = meta.get("conf_weapon", 0.50)

    print(f"\n{GREEN}{BOLD}========== BorderGuard AI YouTube Test Execution =========={RESET}")
    print(f" {BOLD}Model Target{RESET} : {CYAN}{meta.get('name', model_path.stem)} ({model_path.name}){RESET}")
    print(f" {BOLD}Model Engine{RESET} : {model_type.upper()}")
    print(f" {BOLD}Task Category{RESET}: {meta.get('task', 'detect').upper()}")
    print(f" {BOLD}Target Source{RESET}: {youtube_url}")
    print(f" {BOLD}General Conf{RESET}: {confidence}")
    if model_type == "model_7_tactical_threat":
        print(f" {BOLD}Weapon Conf{RESET} : {weapon_conf_thresh} (Strict Filter for Guns vs People Separation)")
    print(f" {BOLD}Speed Stride{RESET}: {stride} (Processing 1 out of every {stride} frame(s))")
    print(f" {BOLD}Scale Factor{RESET}: {scale}x")
    print(f" {BOLD}Hardware{RESET}    : {device.upper()}")
    print(f"{GREEN}==========================================================={RESET}\n")

    print("[*] Initializing Ultralytics AI Model Pipeline...")
    yolo_model = YOLO(str(model_path))

    m3_detector = None
    if model_type == "model_3_anomaly_sentinel":
        m3_weights = MODEL_DIR / "yolo11x.pt"
        if not m3_weights.exists():
            m3_weights = MODEL_DIR / "best.pt"
        if not m3_weights.exists():
            m3_weights = MODEL_DIR / "yolov8x.pt"
        if m3_weights.exists():
            print(f"[*] Model 3 Loading Spatial Personnel & Intruder Backbone: {m3_weights.name}...")
            m3_detector = YOLO(str(m3_weights))

    # Resolve Video Stream
    is_local_file = Path(youtube_url).exists()
    if is_local_file:
        stream_url = str(Path(youtube_url).resolve())
        print(f"[*] Local video source confirmed: {stream_url}")
    else:
        print("[*] Resolving YouTube stream URL via yt-dlp...")
        stream_url = get_stream_url(youtube_url)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    run_stem = f"{model_path.stem}_{timestamp}"
    run_dir = OUTPUT_DIR / run_stem
    run_dir.mkdir(parents=True, exist_ok=True)
    output_video_path = run_dir / f"{model_path.stem}_tested_stream.mp4"

    probe = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=width,height,r_frame_rate",
            "-of", "csv=p=0:s=x",
            stream_url,
        ],
        capture_output=True,
        text=True,
        timeout=30,
    )

    probe_line = probe.stdout.strip().splitlines()
    if not probe_line:
        raise RuntimeError("Could not determine video dimensions via ffprobe.")

    parts = probe_line[0].split("x")
    if len(parts) < 2:
        raise RuntimeError(f"Unexpected video information from ffprobe: {probe.stdout}")

    orig_w, orig_h = int(parts[0]), int(parts[1])

    fps = 25.0
    if len(parts) >= 3:
        try:
            num, den = parts[2].split("/")
            fps = float(num) / float(den)
        except Exception:
            pass

    proc_w = int(orig_w * scale)
    proc_h = int(orig_h * scale)
    proc_w = proc_w if proc_w % 2 == 0 else proc_w - 1
    proc_h = proc_h if proc_h % 2 == 0 else proc_h - 1

    print(f"[*] Source Resolution: {orig_w}x{orig_h} @ {fps:.2f} FPS -> Processing: {proc_w}x{proc_h}")

    ffmpeg_cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
    ]
    if stream_url.startswith(("http://", "https://")):
        ffmpeg_cmd.extend([
            "-reconnect", "1",
            "-reconnect_streamed", "1",
            "-reconnect_delay_max", "5",
        ])
    ffmpeg_cmd.extend([
        "-i", stream_url,
        "-f", "rawvideo",
        "-pix_fmt", "bgr24",
        "pipe:1",
    ])

    frame_bytes = orig_w * orig_h * 3

    ffmpeg = subprocess.Popen(
        ffmpeg_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        bufsize=10**7,
    )

    out_fps = (fps / stride) if stride > 1 else fps
    writer = cv2.VideoWriter(
        str(output_video_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        out_fps if out_fps > 1 else 25.0,
        (proc_w, proc_h),
    )

    if not writer.isOpened():
        ffmpeg.kill()
        raise RuntimeError(f"Could not create output video writer: {output_video_path}")

    # Forensic Evidence Harvest Manager for snapshots & highlight clips
    evidence_mgr = EvidenceHarvestManager(
        run_dir=run_dir,
        model_name=meta.get("name", model_path.stem),
        fps=out_fps,
        device=device,
    )

    window_title = f"BorderGuard AI - {meta['name']} (Press 'q' to stop)"
    print(f"{YELLOW}[+] Stream connected! Processing frames with high-accuracy Unique IDs & Telemetry... (Press 'q' in window to finish){RESET}\n")

    total_stream_frames = 0
    processed_frames = 0

    # --------------------------------------------------------------------------
    # Telemetry Registries
    # --------------------------------------------------------------------------
    # Model 1 Registries (Multi-Object & Categorization)
    m1_tracker = TrackIdManager(prefix="")
    unique_ids_all = set()
    unique_ids_by_cat = defaultdict(set)
    unique_ids_by_class = defaultdict(set)
    class_name_by_id = {}

    # Model 7 Registries (Distinct Guns vs People Separation)
    person_tracker = TrackIdManager(prefix="P")
    gun_tracker = TrackIdManager(prefix="G")
    tracked_person_ids = set()
    tracked_gun_ids = set()
    armed_suspect_person_ids = set()
    unattended_gun_ids = set()
    threat_alert_frames = 0

    # Model 3 Registries (Perimeter Anomaly & Breach Sentinel)
    anomaly_alert_frames = 0
    normal_frames_count = 0
    detected_anomalies_counts = defaultdict(int)
    detected_climber_ids = set()
    ignored_normal_ids = set()
    active_breach_frames = 0

    fps_meter = deque(maxlen=20)
    last_frame_time = time.time()
    start_time = time.time()

    try:
        while True:
            raw = ffmpeg.stdout.read(frame_bytes)
            if len(raw) != frame_bytes:
                break

            total_stream_frames += 1

            if (total_stream_frames - 1) % stride != 0:
                continue

            processed_frames += 1
            now = time.time()
            instant_fps = 1.0 / (now - last_frame_time) if (now - last_frame_time) > 0 else 25.0
            last_frame_time = now
            fps_meter.append(instant_fps)
            cur_fps = sum(fps_meter) / len(fps_meter)

            frame = np.frombuffer(raw, dtype=np.uint8).reshape((orig_h, orig_w, 3))
            if scale != 1.0:
                frame = cv2.resize(frame, (proc_w, proc_h), interpolation=cv2.INTER_LINEAR)
            else:
                frame = frame.copy()

            annotated = frame.copy()

            # Dynamic resolution-adaptive UI scale & proportional bar heights
            ui_scale = float(np.clip(min(proc_w / 1280.0, proc_h / 720.0), 0.32, 1.35))
            top_bar_h = int(np.clip(proc_h * 0.075, 18, 50))
            bot_bar_h = int(np.clip(proc_h * 0.055, 16, 32))
            box_th = max(1, int(round(1.8 * ui_scale)))

            # ==================================================================
            # MODE 1: MODEL 1 - MULTI-OBJECT SENTINEL (UNIQUE ID ON ALL OBJECTS)
            # ==================================================================
            if model_type == "model_1_multi_object":
                # High-Accuracy ByteTrack Tracking with Persistent State
                results = yolo_model.track(
                    frame,
                    persist=True,
                    tracker=TRACKER_CONFIG,
                    conf=confidence,
                    device=device,
                    verbose=False,
                )[0]

                raw_detections = []
                if hasattr(results, "boxes") and results.boxes is not None:
                    for box in results.boxes:
                        coords = box.xyxy[0].cpu().numpy().astype(int)
                        conf_val = float(box.conf[0].cpu())
                        cls_id = int(box.cls[0].cpu())
                        cls_name = yolo_model.names.get(cls_id, f"obj_{cls_id}").lower()
                        raw_tid = int(box.id[0].cpu()) if box.id is not None else None

                        raw_detections.append({
                            "bbox": coords,
                            "conf": conf_val,
                            "class": cls_name,
                            "raw_track_id": raw_tid,
                        })

                # Assign guaranteed persistent Unique IDs to ALL detected objects
                assigned_dets = m1_tracker.assign_ids(raw_detections)

                # Check for weapon / threat presence in current frame
                weapon_threat_dets = [d for d in assigned_dets if get_category_info(d["class"])[0] == "WEAPON / THREAT"]
                has_weapon_threat = len(weapon_threat_dets) > 0

                live_by_cat = defaultdict(int)
                for det in assigned_dets:
                    uid = det["track_id"]
                    cls_name = det["class"]
                    cat_name, cat_color = get_category_info(cls_name)

                    # Update cumulative tracking registries
                    unique_ids_all.add(uid)
                    unique_ids_by_cat[cat_name].add(uid)
                    unique_ids_by_class[cls_name].add(uid)
                    class_name_by_id[uid] = cls_name
                    live_by_cat[cat_name] += 1

                    # Check if person is in breach / threat state (holding/near weapon)
                    is_person = (cls_name == "person")
                    is_breach_suspect = False
                    threat_desc = "NORMAL"

                    if is_person and has_weapon_threat:
                        px1, py1, px2, py2 = det["bbox"]
                        pw, ph = max(1, px2 - px1), max(1, py2 - py1)
                        p_center = np.array([(px1 + px2) / 2.0, (py1 + py2) / 2.0])
                        for wd in weapon_threat_dets:
                            wx1, wy1, wx2, wy2 = wd["bbox"]
                            w_center = np.array([(wx1 + wx2) / 2.0, (wy1 + wy2) / 2.0])
                            dist_norm = np.linalg.norm(p_center - w_center) / float(ph)
                            if dist_norm < 0.65:
                                is_breach_suspect = True
                                threat_desc = f"ARMED ({wd['class'].upper()})"
                                break

                    # Harvest evidence for all persons
                    if is_person:
                        evidence_mgr.record_person_frame(
                            person_id=f"PERSON #{uid}",
                            unannotated_frame=frame,
                            bbox=det["bbox"],
                            conf=det["conf"],
                            is_suspect=is_breach_suspect,
                            activity_name=threat_desc if is_breach_suspect else "NORMAL",
                            is_breach=is_breach_suspect,
                            anomaly_conf=det["conf"] if is_breach_suspect else 0.0,
                            frame_idx=processed_frames,
                        )

                    # Color and label styling: Crimson alert for breach suspects
                    if is_breach_suspect:
                        cat_color = (0, 0, 240)
                        if proc_w < 700:
                            label_str = f"[! BREACH !] #{uid} ARMED"
                        else:
                            label_str = f"[! CAUGHT IN BREACH ACTIVITY: {threat_desc} !] #{uid} {int(det['conf'] * 100)}%"
                    else:
                        if proc_w < 700 or (x2 - x1) < 90:
                            label_str = f"#{uid} {cls_name[:6].upper()} {int(det['conf'] * 100)}%"
                        else:
                            label_str = f"[ID: #{uid}] {cls_name.upper()} [{cat_name}] {int(det['conf'] * 100)}%"

                    # Draw Bounding Box with Corner Reticles scaled
                    x1, y1, x2, y2 = det["bbox"]
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), cat_color, box_th)
                    corner_len = min(int(14 * ui_scale), max(3, (x2 - x1) // 5))
                    if corner_len > 3 and (x2 - x1) > 20:
                        cv2.line(annotated, (x1, y1), (x1 + corner_len, y1), (255, 255, 255), box_th)
                        cv2.line(annotated, (x1, y1), (x1, y1 + corner_len), (255, 255, 255), box_th)
                        cv2.line(annotated, (x2, y2), (x2 - corner_len, y2), (255, 255, 255), box_th)
                        cv2.line(annotated, (x2, y2), (x2, y2 - corner_len), (255, 255, 255), box_th)

                    draw_styled_badge(
                        annotated,
                        text=label_str,
                        x=x1,
                        y=y1,
                        bg_color=cat_color,
                        text_color=(0, 0, 0) if (cat_color[0] + cat_color[1] + cat_color[2] > 400 and not is_breach_suspect) else (255, 255, 255),
                        position="above",
                        box_coords=(x1, y1, x2, y2),
                        ui_scale=ui_scale,
                        top_limit=top_bar_h,
                        bottom_limit=bot_bar_h,
                    )

                # Buffer frame for highlight clip if threat/breach active
                evidence_mgr.buffer_annotated_frame(annotated, is_event_active=has_weapon_threat)

                # MODEL 1 TELEMETRY HUD OVERLAY (ADAPTIVE PROPORTIONS)
                overlay = annotated.copy()
                cv2.rectangle(overlay, (0, 0), (proc_w, top_bar_h), (10, 16, 22), -1)
                cv2.addWeighted(overlay, 0.85, annotated, 0.15, 0, annotated)
                cv2.line(annotated, (0, top_bar_h), (proc_w, top_bar_h), (0, 229, 255), 1)

                total_unique_cnt = len(unique_ids_all)
                live_active_cnt = len(assigned_dets)

                hud_font_scale = np.clip(0.48 * ui_scale, 0.26, 0.54)
                hud_ty = int(top_bar_h * 0.68)

                if proc_w < 550:
                    hud_l1 = f"SENTINEL | TOTAL: {total_unique_cnt} | LIVE: {live_active_cnt} | {cur_fps:.0f} FPS"
                elif proc_w < 850:
                    hud_l1 = f"BORDERGUARD AI | TOTAL UNIQUE: {total_unique_cnt} | LIVE: {live_active_cnt} | FPS: {cur_fps:.1f}"
                else:
                    top_cats = ["PERSONNEL", "VEHICLE", "GEAR / BAG", "ANIMAL", "WEAPON / THREAT"]
                    active_cats = [f"{tc}: {len(unique_ids_by_cat[tc])}" for tc in top_cats if len(unique_ids_by_cat[tc]) > 0]
                    cat_summary = " | " + " ".join(active_cats[:3]) if active_cats else ""
                    hud_l1 = f"BORDERGUARD AI | SOTA MULTI-OBJECT SENTINEL | UNIQUE: {total_unique_cnt} | LIVE: {live_active_cnt}{cat_summary} | FPS: {cur_fps:.1f}"

                cv2.putText(annotated, hud_l1, (max(6, int(10 * ui_scale)), hud_ty), cv2.FONT_HERSHEY_SIMPLEX, hud_font_scale, (0, 229, 255), 1, cv2.LINE_AA)

                # Bottom status bar
                cv2.rectangle(annotated, (0, proc_h - bot_bar_h), (proc_w, proc_h), (12, 18, 24), -1)
                bot_font_scale = np.clip(0.38 * ui_scale, 0.24, 0.44)
                bot_ty = proc_h - int(bot_bar_h * 0.30)
                if proc_w < 550:
                    bottom_status = f"Frame: {total_stream_frames} | Active: {live_active_cnt} | Conf: {confidence:.2f}"
                else:
                    active_classes_str = ", ".join([f"{k}: {v}" for k, v in live_by_cat.items() if v > 0]) or "No active detections"
                    bottom_status = f"LIVE HUD | Active: [{active_classes_str}] | Stream Frame: {total_stream_frames} | Conf: {confidence:.2f}"
                cv2.putText(annotated, bottom_status, (max(6, int(10 * ui_scale)), bot_ty), cv2.FONT_HERSHEY_SIMPLEX, bot_font_scale, (0, 215, 255), 1, cv2.LINE_AA)

            # ==================================================================
            # MODE 2: MODEL 7 - TACTICAL WEAPON & PERSONNEL SENTINEL
            # ("THINK WISELY": SEPARATE LABELS & DEDICATED TRACKING FOR GUNS VS PEOPLE)
            # ==================================================================
            elif model_type == "model_7_tactical_threat":
                results = yolo_model.track(
                    frame,
                    persist=True,
                    tracker=TRACKER_CONFIG,
                    conf=confidence,
                    device=device,
                    verbose=False,
                )[0]

                raw_person_dets = []
                raw_gun_dets = []

                if hasattr(results, "boxes") and results.boxes is not None:
                    for box in results.boxes:
                        coords = box.xyxy[0].cpu().numpy().astype(int)
                        conf_val = float(box.conf[0].cpu())
                        cls_id = int(box.cls[0].cpu())
                        cls_name = yolo_model.names.get(cls_id, f"class_{cls_id}").lower()
                        raw_tid = int(box.id[0].cpu()) if box.id is not None else None

                        item = {
                            "bbox": coords,
                            "conf": conf_val,
                            "class": cls_name,
                            "raw_track_id": raw_tid,
                        }

                        if "person" in cls_name and conf_val >= confidence:
                            raw_person_dets.append(item)
                        elif ("gun" in cls_name or "weapon" in cls_name or "knife" in cls_name or "pistol" in cls_name or "rifle" in cls_name) and conf_val >= weapon_conf_thresh:
                            raw_gun_dets.append(item)

                # Dedicated Track ID Managers: Completely separate Person IDs (P1, P2) and Gun IDs (G1, G2)
                assigned_persons = person_tracker.assign_ids(raw_person_dets)
                assigned_guns = gun_tracker.assign_ids(raw_gun_dets)

                for p in assigned_persons:
                    tracked_person_ids.add(p["formatted_id"])
                for g in assigned_guns:
                    tracked_gun_ids.add(g["formatted_id"])

                # SPATIAL PERSON-GUN ASSOCIATION ("WHO IS CARRYING WHAT")
                # Links guns to carrying persons, detects unassociated / unattended firearms
                gun_to_person = {}
                person_to_guns = defaultdict(list)

                for g_idx, g_item in enumerate(assigned_guns):
                    gx1, gy1, gx2, gy2 = g_item["bbox"]
                    g_center = np.array([(gx1 + gx2) / 2.0, (gy1 + gy2) / 2.0])

                    best_p_idx = None
                    best_score = 999.0

                    for p_idx, p_item in enumerate(assigned_persons):
                        px1, py1, px2, py2 = p_item["bbox"]
                        pw = max(1, px2 - px1)
                        ph = max(1, py2 - py1)
                        p_center = np.array([(px1 + px2) / 2.0, (py1 + py2) / 2.0])

                        # Proximity relative to person height
                        dist_norm = np.linalg.norm(p_center - g_center) / float(ph)
                        inside_torso_reach = (px1 - pw * 0.20 <= g_center[0] <= px2 + pw * 0.20) and \
                                             (py1 - ph * 0.05 <= g_center[1] <= py2 + ph * 0.15)

                        if inside_torso_reach or dist_norm < 0.55:
                            if dist_norm < best_score:
                                best_score = dist_norm
                                best_p_idx = p_idx

                    if best_p_idx is not None:
                        gun_to_person[g_idx] = best_p_idx
                        person_to_guns[best_p_idx].append(g_idx)
                        armed_suspect_person_ids.add(assigned_persons[best_p_idx]["formatted_id"])
                    else:
                        unattended_gun_ids.add(g_item["formatted_id"])

                has_armed_threat = len(person_to_guns) > 0
                has_unattended_threat = (len(assigned_guns) > len(gun_to_person))
                if has_armed_threat or has_unattended_threat:
                    threat_alert_frames += 1

                # -------------------------------------------------------------
                # 1. DRAW PERSONS WITH INTENTIONAL SEPARATION
                # -------------------------------------------------------------
                for p_idx, p_item in enumerate(assigned_persons):
                    px1, py1, px2, py2 = p_item["bbox"]
                    is_armed = p_idx in person_to_guns
                    associated_gun_indices = person_to_guns.get(p_idx, [])
                    gun_tags = ", ".join([assigned_guns[gi]["formatted_id"] for gi in associated_gun_indices])

                    if is_armed:
                        p_color = (0, 0, 230)  # Vivid Alert Crimson Red for Armed Suspect
                        p_badge_bg = (0, 0, 200)
                        p_status = "ARMED"
                        if proc_w < 700:
                            p_label = f"[! BREACH !] {p_item['formatted_id']} ARMED"
                        else:
                            p_label = f"[! BREACH !] [{p_item['formatted_id']}] ARMED INTRUDER {int(p_item['conf'] * 100)}% (WITH {gun_tags})"
                        p_th = max(2, int(round(2.4 * ui_scale)))

                        evidence_mgr.record_person_frame(
                            person_id=f"PERSON [{p_item['formatted_id']}]",
                            unannotated_frame=frame,
                            bbox=p_item["bbox"],
                            conf=p_item["conf"],
                            is_suspect=True,
                            activity_name="ARMED INTRUSION",
                            is_breach=True,
                            anomaly_conf=p_item["conf"],
                            frame_idx=processed_frames,
                        )
                    else:
                        p_color = (0, 220, 115)  # Clean Emerald Green for Safe Personnel
                        p_badge_bg = (0, 140, 70)
                        if proc_w < 700:
                            p_label = f"{p_item['formatted_id']} SAFE"
                        else:
                            p_label = f"[{p_item['formatted_id']}] PERSONNEL (SAFE) {int(p_item['conf'] * 100)}%"
                        p_th = box_th

                        evidence_mgr.record_person_frame(
                            person_id=f"PERSON [{p_item['formatted_id']}]",
                            unannotated_frame=frame,
                            bbox=p_item["bbox"],
                            conf=p_item["conf"],
                            is_suspect=False,
                            activity_name="SAFE PERSONNEL",
                            is_breach=False,
                            anomaly_conf=0.0,
                            frame_idx=processed_frames,
                        )

                    cv2.rectangle(annotated, (px1, py1), (px2, py2), p_color, p_th)

                    # PERSON BADGE: Rendered strictly ABOVE person box to prevent label collisions
                    draw_styled_badge(
                        annotated,
                        text=p_label,
                        x=px1,
                        y=py1,
                        bg_color=p_badge_bg,
                        text_color=(255, 255, 255),
                        position="above",
                        box_coords=(px1, py1, px2, py2),
                        ui_scale=ui_scale,
                        top_limit=top_bar_h,
                        bottom_limit=bot_bar_h,
                    )

                # -------------------------------------------------------------
                # 2. DRAW GUNS WITH NON-COLLIDING BADGES & SPATIAL TETHER
                # -------------------------------------------------------------
                for g_idx, g_item in enumerate(assigned_guns):
                    gx1, gy1, gx2, gy2 = g_item["bbox"]
                    g_center = (int((gx1 + gx2) / 2.0), int((gy1 + gy2) / 2.0))
                    carrier_p_idx = gun_to_person.get(g_idx)

                    # High-visibility neon red for all firearms
                    g_color = (0, 0, 255)
                    cv2.rectangle(annotated, (gx1, gy1), (gx2, gy2), g_color, box_th)

                    # Corner highlight brackets for weapon emphasis
                    cw = min(int(10 * ui_scale), max(3, (gx2 - gx1) // 3))
                    if cw > 3:
                        cv2.line(annotated, (gx1, gy1), (gx1 + cw, gy1), (255, 255, 255), box_th)
                        cv2.line(annotated, (gx1, gy1), (gx1, gy1 + cw), (255, 255, 255), box_th)
                        cv2.line(annotated, (gx2, gy2), (gx2 - cw, gy2), (255, 255, 255), box_th)
                        cv2.line(annotated, (gx2, gy2), (gx2, gy2 - cw), (255, 255, 255), box_th)

                    if carrier_p_idx is not None:
                        carrier = assigned_persons[carrier_p_idx]
                        c_id = carrier["formatted_id"]
                        if proc_w < 700:
                            g_label = f"[*] {g_item['formatted_id']} GUN ({c_id})"
                        else:
                            g_label = f"[*] [{g_item['formatted_id']}] FIREARM {int(g_item['conf'] * 100)}% (HELD BY {c_id})"
                        g_badge_bg = (0, 0, 180)

                        # Draw Dynamic Threat Tether Line connecting Person to Held Gun
                        c_px1, c_py1, c_px2, c_py2 = carrier["bbox"]
                        c_anchor = (int((c_px1 + c_px2) / 2.0), int(c_py1 + (c_py2 - c_py1) * 0.45))
                        cv2.line(annotated, c_anchor, g_center, (0, 255, 255), max(1, int(round(1.5 * ui_scale))), cv2.LINE_AA)
                        mid_x = (c_anchor[0] + g_center[0]) // 2
                        mid_y = (c_anchor[1] + g_center[1]) // 2
                        cv2.circle(annotated, (mid_x, mid_y), max(2, int(3 * ui_scale)), (0, 0, 255), -1)
                    else:
                        if proc_w < 700:
                            g_label = f"[!] {g_item['formatted_id']} GUN (DROP)"
                        else:
                            g_label = f"[!] [{g_item['formatted_id']}] UNATTENDED FIREARM {int(g_item['conf'] * 100)}%"
                        g_badge_bg = (0, 69, 255)  # Orange-Red alert for ground hazard

                    # GUN BADGE: Rendered strictly BELOW or RIGHT of weapon box
                    draw_styled_badge(
                        annotated,
                        text=g_label,
                        x=gx1,
                        y=gy1,
                        bg_color=g_badge_bg,
                        text_color=(255, 255, 255),
                        position="below",
                        box_coords=(gx1, gy1, gx2, gy2),
                        ui_scale=ui_scale,
                        top_limit=top_bar_h,
                        bottom_limit=bot_bar_h,
                    )

                # MODEL 7 TACTICAL ALERT HUD OVERLAY
                alert_font_scale = np.clip(0.50 * ui_scale, 0.26, 0.60)
                alert_ty = int(top_bar_h * 0.68)
                if has_armed_threat:
                    alert_bg = (0, 0, 220) if (processed_frames // 4) % 2 == 0 else (0, 0, 130)
                    armed_str = ", ".join(list(armed_suspect_person_ids)[-3:])
                    if proc_w < 600:
                        banner_text = f"[! ALERT !] PERIMETER BREACH: ARMED [{armed_str}]"
                    else:
                        banner_text = f"[! ALERT !] CRITICAL PERIMETER BREACH: ARMED INTRUDER [{armed_str}]"
                    cv2.rectangle(annotated, (0, 0), (proc_w, top_bar_h), alert_bg, -1)
                    cv2.putText(annotated, banner_text, (max(6, int(10 * ui_scale)), alert_ty), cv2.FONT_HERSHEY_SIMPLEX, alert_font_scale, (255, 255, 255), 1 if ui_scale < 0.75 else 2, cv2.LINE_AA)
                elif has_unattended_threat:
                    alert_bg = (0, 120, 220)
                    banner_text = "[!] WARNING: UNATTENDED WEAPON / HAZARD" if proc_w < 600 else "[!] WARNING: UNATTENDED WEAPON / HAZARD DETECTED IN SECTOR!"
                    cv2.rectangle(annotated, (0, 0), (proc_w, top_bar_h), alert_bg, -1)
                    cv2.putText(annotated, banner_text, (max(6, int(10 * ui_scale)), alert_ty), cv2.FONT_HERSHEY_SIMPLEX, alert_font_scale, (255, 255, 255), 1 if ui_scale < 0.75 else 2, cv2.LINE_AA)
                else:
                    cv2.rectangle(annotated, (0, 0), (proc_w, top_bar_h), (16, 24, 20), -1)
                    normal_text = "MODEL 7 | PERIMETER CLEAR" if proc_w < 600 else "BORDERGUARD AI | MODEL 7 TACTICAL SENTINEL - PERIMETER MONITORED (SECTOR CLEAR)"
                    cv2.putText(annotated, normal_text, (max(6, int(10 * ui_scale)), alert_ty), cv2.FONT_HERSHEY_SIMPLEX, alert_font_scale, (0, 230, 115), 1, cv2.LINE_AA)

                # Buffer frame for highlight video clip
                evidence_mgr.buffer_annotated_frame(annotated, is_event_active=(has_armed_threat or has_unattended_threat))

                # Bottom Telemetry Bar for Model 7
                cv2.rectangle(annotated, (0, proc_h - bot_bar_h), (proc_w, proc_h), (10, 16, 22), -1)
                bot_font_scale = np.clip(0.38 * ui_scale, 0.24, 0.44)
                bot_ty = proc_h - int(bot_bar_h * 0.30)
                safe_cnt = sum(1 for p_idx in range(len(assigned_persons)) if p_idx not in person_to_guns)
                armed_cnt = len(person_to_guns)
                held_guns_cnt = len(gun_to_person)
                unattended_cnt = len(assigned_guns) - held_guns_cnt

                if proc_w < 600:
                    hud_p = f"PERSONNEL: P: {len(assigned_persons)} ({armed_cnt} armed)"
                    hud_g = f"WEAPONS: G: {len(assigned_guns)} ({held_guns_cnt} held)"
                else:
                    hud_p = f"PERSONNEL: PEOPLE: {len(assigned_persons)} Active ({safe_cnt} Safe, {armed_cnt} Armed) | Tracked: {len(tracked_person_ids)}"
                    hud_g = f"WEAPONS: GUNS: {len(assigned_guns)} Active ({held_guns_cnt} In-Hand, {unattended_cnt} Ground) | Tracked: {len(tracked_gun_ids)}"
                cv2.putText(annotated, f"{hud_p}  ||  {hud_g}", (max(6, int(10 * ui_scale)), bot_ty), cv2.FONT_HERSHEY_SIMPLEX, bot_font_scale, (0, 229, 255), 1, cv2.LINE_AA)

            # ==================================================================
            # MODE 3: MODEL 3 - INTELLIGENT PERIMETER ANOMALY & BREACH SENTINEL
            # (PER-PERSON BEHAVIORAL + SPATIAL BREACH RECOGNITION & CROWD FILTERING)
            # ==================================================================
            elif model_type == "model_3_anomaly_sentinel":
                # Step 1: Detect and track all personnel in the frame
                det_engine = m3_detector if m3_detector is not None else yolo_model
                track_res = det_engine.track(
                    frame,
                    persist=True,
                    conf=min(0.20, confidence),
                    tracker=TRACKER_CONFIG,
                    verbose=False,
                )[0]

                # Step 2: Also run anomaly classifier if available to get scene context
                scene_hazard = "NORMAL"
                scene_conf = 0.0
                if hasattr(yolo_model, "probs") or (hasattr(yolo_model, "task") and yolo_model.task == "classify"):
                    try:
                        cls_res = yolo_model(frame, verbose=False)[0]
                        if cls_res.probs is not None:
                            top1_i = int(cls_res.probs.top1)
                            scene_hazard = yolo_model.names.get(top1_i, "NORMAL")
                            scene_conf = float(cls_res.probs.top1conf.cpu())
                    except Exception:
                        pass

                # Step 3: Run pose model for keypoint extraction on candidates if available
                pose_dict = {}
                if evidence_mgr.pose_model is not None:
                    try:
                        p_res = evidence_mgr.pose_model(frame, conf=0.15, verbose=False)[0]
                        if hasattr(p_res, "boxes") and p_res.boxes is not None and len(p_res.boxes) > 0:
                            for pi, pbox in enumerate(p_res.boxes):
                                pb = pbox.xyxy[0].cpu().numpy().astype(int)
                                pk = p_res.keypoints[pi].data[0].cpu().numpy() if p_res.keypoints is not None else None
                                pose_dict[pi] = (pb, pk)
                    except Exception:
                        pass

                # Step 4: Evaluate each detected person individually
                frame_climbers = []
                frame_normals = []

                if hasattr(track_res, "boxes") and track_res.boxes is not None and len(track_res.boxes) > 0:
                    for b_idx, box in enumerate(track_res.boxes):
                        cls_id = int(box.cls[0])
                        # Filter for person class (COCO 0, or person in specialized models)
                        is_person_cls = (cls_id == 0)
                        if hasattr(det_engine, "names") and cls_id in det_engine.names:
                            is_person_cls = (det_engine.names[cls_id].lower() == "person")
                        if not is_person_cls:
                            continue

                        coords = box.xyxy[0].cpu().numpy().astype(int)
                        p_conf = float(box.conf[0])
                        raw_tid = int(box.id[0]) if box.id is not None else (b_idx + 1)

                        # Match with pose keypoints if close IoU
                        matched_kpts = None
                        for pb, pk in pose_dict.values():
                            if compute_iou(coords, pb) > 0.40:
                                matched_kpts = pk
                                break

                        # Evaluate threat
                        is_suspicious, threat_type, threat_score, reasons = evaluate_perimeter_threat(
                            box=coords,
                            frame_w=proc_w,
                            frame_h=proc_h,
                            pose_kpts=matched_kpts,
                        )

                        if is_suspicious:
                            frame_climbers.append({
                                "track_id": raw_tid,
                                "bbox": coords,
                                "conf": p_conf,
                                "threat_score": threat_score,
                                "threat_type": threat_type,
                                "reasons": reasons,
                                "kpts": matched_kpts,
                            })
                            detected_climber_ids.add(raw_tid)
                        else:
                            frame_normals.append({
                                "track_id": raw_tid,
                                "bbox": coords,
                                "conf": p_conf,
                            })
                            ignored_normal_ids.add(raw_tid)

                is_anomaly = (len(frame_climbers) > 0)
                is_breach = is_anomaly
                top1_name = "Fence Climber / Breach" if is_anomaly else "Normal Spectators"

                if is_anomaly:
                    anomaly_alert_frames += 1
                    active_breach_frames += 1
                    detected_anomalies_counts["Fence Climbing / Breach"] += len(frame_climbers)
                else:
                    normal_frames_count += 1

                # Step 5: Visual Warning Frame if breach active
                if is_anomaly:
                    anom_border_th = max(1, int(round(2.5 * ui_scale)))
                    cv2.rectangle(annotated, (0, 0), (proc_w - 1, proc_h - 1), (0, 0, 240), anom_border_th)
                    bracket_len = min(int(30 * ui_scale), max(6, proc_w // 16))
                    reticle_color = (0, 0, 255) if (processed_frames // 4) % 2 == 0 else (0, 255, 255)
                    # Corners
                    if bracket_len > 4:
                        cv2.line(annotated, (0, 0), (bracket_len, 0), reticle_color, anom_border_th)
                        cv2.line(annotated, (0, 0), (0, bracket_len), reticle_color, anom_border_th)
                        cv2.line(annotated, (proc_w - 1, 0), (proc_w - 1 - bracket_len, 0), reticle_color, anom_border_th)
                        cv2.line(annotated, (proc_w - 1, 0), (proc_w - 1, bracket_len), reticle_color, anom_border_th)
                        cv2.line(annotated, (0, proc_h - 1), (bracket_len, proc_h - 1), reticle_color, anom_border_th)
                        cv2.line(annotated, (0, proc_h - 1), (0, proc_h - 1 - bracket_len), reticle_color, anom_border_th)
                        cv2.line(annotated, (proc_w - 1, proc_h - 1), (proc_w - 1 - bracket_len, proc_h - 1), reticle_color, anom_border_th)
                        cv2.line(annotated, (proc_w - 1, proc_h - 1), (proc_w - 1, proc_h - 1 - bracket_len), reticle_color, anom_border_th)

                # Step 6: Render ONLY SUSPICIOUS CLIMBERS!
                # (Normal ground spectators are IGNORED per user instruction)
                for climber in frame_climbers:
                    c_id = climber["track_id"]
                    px1, py1, px2, py2 = climber["bbox"]
                    c_score = climber["threat_score"]

                    # Tactical Crimson Box
                    s_color = (0, 0, 240)
                    s_th = max(2, int(round(2.2 * ui_scale)))
                    cv2.rectangle(annotated, (px1, py1), (px2, py2), s_color, s_th)

                    # White Corner Reticles
                    corner_l = min(int(14 * ui_scale), max(4, (px2 - px1) // 4))
                    if corner_l > 4:
                        cv2.line(annotated, (px1, py1), (px1 + corner_l, py1), (255, 255, 255), s_th)
                        cv2.line(annotated, (px1, py1), (px1, py1 + corner_l), (255, 255, 255), s_th)
                        cv2.line(annotated, (px2, py2), (px2 - corner_l, py2), (255, 255, 255), s_th)
                        cv2.line(annotated, (px2, py2), (px2, py2 - corner_l), (255, 255, 255), s_th)

                    if proc_w < 650:
                        s_label = f"[! FENCE CLIMBER !] #{c_id} ({int(c_score * 100)}%)"
                    else:
                        s_label = f"[! SUSPICIOUS: FENCE CLIMBER / PERIMETER BREACH !] ID: #{c_id} ({int(c_score * 100)}%)"

                    draw_styled_badge(
                        annotated,
                        text=s_label,
                        x=px1,
                        y=py1,
                        bg_color=(0, 0, 200),
                        text_color=(255, 255, 255),
                        position="above",
                        box_coords=(px1, py1, px2, py2),
                        ui_scale=ui_scale,
                        top_limit=top_bar_h,
                        bottom_limit=bot_bar_h,
                    )

                    # Forensic snapshot recorded for suspicious climber
                    evidence_mgr.record_person_frame(
                        person_id=f"SUSPECT #{c_id}",
                        unannotated_frame=frame,
                        bbox=(px1, py1, px2, py2),
                        conf=climber["conf"],
                        is_suspect=True,
                        activity_name="FENCE CLIMBER / PERIMETER INTRUSION",
                        is_breach=True,
                        anomaly_conf=c_score,
                        frame_idx=processed_frames,
                        keypoints=climber["kpts"],
                    )

                # Buffer frame for highlight video clip
                evidence_mgr.buffer_annotated_frame(annotated, is_event_active=is_anomaly)

                # TOP ALERT BANNER (ADAPTIVE PROPORTIONS)
                banner_font_scale = np.clip(0.50 * ui_scale, 0.26, 0.60)
                banner_ty = int(top_bar_h * 0.68)
                if is_anomaly:
                    pulse_bg = (0, 0, 220) if (processed_frames // 4) % 2 == 0 else (0, 0, 130)
                    cv2.rectangle(annotated, (0, 0), (proc_w, top_bar_h), pulse_bg, -1)
                    if proc_w < 600:
                        banner_text = f"[! ALERT !] CRITICAL PERIMETER BREACH: {len(frame_climbers)} FENCE CLIMBER(S)"
                    else:
                        banner_text = f"[! CRITICAL PERIMETER BREACH !] FENCE CLIMBER(S) DETECTED: {len(frame_climbers)} ACTIVE | CROWD FILTERED"
                    cv2.putText(annotated, banner_text, (max(6, int(10 * ui_scale)), banner_ty), cv2.FONT_HERSHEY_SIMPLEX, banner_font_scale, (255, 255, 255), 1 if ui_scale < 0.75 else 2, cv2.LINE_AA)
                else:
                    cv2.rectangle(annotated, (0, 0), (proc_w, top_bar_h), (16, 28, 20), -1)
                    if proc_w < 600:
                        normal_text = f"[SECURE] PERIMETER MONITORED ({len(frame_normals)} BYSTANDERS IGNORED)"
                    else:
                        normal_text = f"[SECURE] PERIMETER MONITORED | NORMAL GROUND SPECTATORS IGNORED: {len(frame_normals)} | NO BREACH"
                    cv2.putText(annotated, normal_text, (max(6, int(10 * ui_scale)), banner_ty), cv2.FONT_HERSHEY_SIMPLEX, banner_font_scale, (0, 240, 120), 1, cv2.LINE_AA)

                # SECTOR SECURITY TELEMETRY CARD (Resolution-Adaptive & Non-Intrusive)
                if proc_w < 440 or proc_h < 300:
                    card_w = min(120, int(proc_w * 0.38))
                    card_h = min(42, int(proc_h * 0.18))
                    card_x = max(4, int(6 * ui_scale))
                    card_y = top_bar_h + 2

                    card_overlay = annotated.copy()
                    cv2.rectangle(card_overlay, (card_x, card_y), (card_x + card_w, card_y + card_h), (12, 16, 24), -1)
                    cv2.addWeighted(card_overlay, 0.72, annotated, 0.28, 0, annotated)
                    cv2.rectangle(annotated, (card_x, card_y), (card_x + card_w, card_y + card_h), (0, 229, 255), 1)

                    cv2.putText(annotated, f"CLIMBERS:{len(frame_climbers)}", (card_x + 4, card_y + 14), cv2.FONT_HERSHEY_SIMPLEX, 0.28, (0, 0, 255) if frame_climbers else (0, 240, 120), 1, cv2.LINE_AA)
                    cv2.putText(annotated, f"IGNORED:{len(frame_normals)}", (card_x + 4, card_y + 28), cv2.FONT_HERSHEY_SIMPLEX, 0.28, (180, 200, 210), 1, cv2.LINE_AA)
                    cv2.putText(annotated, "BREACH!" if is_anomaly else "SECURE", (card_x + 4, card_y + 39), cv2.FONT_HERSHEY_SIMPLEX, 0.26, (0, 0, 255) if is_anomaly else (0, 240, 120), 1, cv2.LINE_AA)
                else:
                    card_w = int(np.clip(proc_w * 0.26, 170, 250))
                    card_h = int(np.clip(proc_h * 0.22, 75, 115))
                    card_x = max(6, int(10 * ui_scale))
                    card_y = top_bar_h + max(3, int(6 * ui_scale))

                    card_overlay = annotated.copy()
                    cv2.rectangle(card_overlay, (card_x, card_y), (card_x + card_w, card_y + card_h), (12, 16, 24), -1)
                    cv2.addWeighted(card_overlay, 0.78, annotated, 0.22, 0, annotated)
                    card_border_c = (0, 0, 255) if is_anomaly else (0, 229, 255)
                    cv2.rectangle(annotated, (card_x, card_y), (card_x + card_w, card_y + card_h), card_border_c, 1)

                    card_font_scale = np.clip(0.36 * ui_scale, 0.24, 0.42)
                    cv2.putText(annotated, "PERIMETER TELEMETRY", (card_x + int(8 * ui_scale), card_y + int(16 * ui_scale)), cv2.FONT_HERSHEY_SIMPLEX, card_font_scale, (0, 229, 255), 1, cv2.LINE_AA)

                    c_color = (0, 0, 255) if frame_climbers else (0, 240, 120)
                    cv2.putText(annotated, f"Active Climbers : {len(frame_climbers)}", (card_x + int(8 * ui_scale), card_y + int(34 * ui_scale)), cv2.FONT_HERSHEY_SIMPLEX, card_font_scale * 0.9, c_color, 1, cv2.LINE_AA)
                    cv2.putText(annotated, f"Crowd Filtered  : {len(frame_normals)}", (card_x + int(8 * ui_scale), card_y + int(50 * ui_scale)), cv2.FONT_HERSHEY_SIMPLEX, card_font_scale * 0.9, (180, 200, 210), 1, cv2.LINE_AA)
                    sec_status = "CRITICAL INTRUSION" if is_anomaly else "SECTOR SECURE"
                    s_color = (0, 0, 255) if is_anomaly else (0, 240, 120)
                    cv2.putText(annotated, f"Status: {sec_status}", (card_x + int(8 * ui_scale), card_y + int(66 * ui_scale)), cv2.FONT_HERSHEY_SIMPLEX, card_font_scale * 0.9, s_color, 1, cv2.LINE_AA)

                # BOTTOM TELEMETRY STATUS BAR
                cv2.rectangle(annotated, (0, proc_h - bot_bar_h), (proc_w, proc_h), (10, 16, 22), -1)
                total_anom = anomaly_alert_frames
                anom_rate = (total_anom / processed_frames * 100.0) if processed_frames > 0 else 0.0
                bot_font_scale = np.clip(0.38 * ui_scale, 0.24, 0.44)
                bot_ty = proc_h - int(bot_bar_h * 0.30)
                if proc_w < 550:
                    bot_text = f"M3 | Frames: {processed_frames} | Breach Alerts: {total_anom} ({anom_rate:.0f}%) | Climbers: {len(detected_climber_ids)} | {cur_fps:.0f} FPS"
                else:
                    bot_text = f"MODEL 3 SENTINEL | Frames: {processed_frames} | Breach Alert Frames: {total_anom} ({anom_rate:.1f}%) | Climbers Tracked: {len(detected_climber_ids)} | Bystanders Ignored: {len(ignored_normal_ids)} | FPS: {cur_fps:.1f}"
                cv2.putText(annotated, bot_text, (max(6, int(10 * ui_scale)), bot_ty), cv2.FONT_HERSHEY_SIMPLEX, bot_font_scale, (0, 229, 255), 1, cv2.LINE_AA)


            writer.write(annotated)

            if show_display:
                cv2.imshow(window_title, annotated)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    print(f"\n{YELLOW}[!] Processing stopped by user.{RESET}")
                    break

    finally:
        writer.release()
        try:
            ffmpeg.terminate()
            ffmpeg.wait(timeout=3)
        except Exception:
            ffmpeg.kill()
        if show_display:
            cv2.destroyAllWindows()

        # Finalize and export all forensic evidence
        saved_evidence = evidence_mgr.finalize()

    elapsed = time.time() - start_time
    avg_fps = (processed_frames / elapsed) if elapsed > 0 else 0.0

    print(f"\n{GREEN}{BOLD}==================== TEST COMPLETED SUCCESSFULLY ===================={RESET}")
    print(f" {BOLD}Target Model{RESET}          : {CYAN}{meta['name']}{RESET}")
    print(f" {BOLD}Total Frames Processed{RESET}: {processed_frames} (Stride: {stride}x)")
    print(f" {BOLD}Elapsed Time{RESET}          : {elapsed:.2f} seconds")
    print(f" {BOLD}Average Test Speed{RESET}    : {CYAN}{avg_fps:.1f} FPS{RESET}")

    if model_type == "model_1_multi_object":
        print(f"\n{YELLOW}{BOLD}--- MODEL 1: MULTI-OBJECT UNIQUE ID & CATEGORY BREAKDOWN ---{RESET}")
        print(f" {BOLD}Total Unique Objects Tracked{RESET}: {CYAN}{len(unique_ids_all)}{RESET}")
        print(f" {BOLD}Categorical Summary:{RESET}")
        for cat_name, ids in sorted(unique_ids_by_cat.items(), key=lambda x: -len(x[1])):
            print(f"   ├─ {BOLD}{cat_name:<18}{RESET}: {CYAN}{len(ids):3d}{RESET} unique entities")
        print(f"\n {BOLD}Top Detected Object Classes:{RESET}")
        for cls_name, ids in sorted(unique_ids_by_class.items(), key=lambda x: -len(x[1]))[:12]:
            print(f"   ├─ {cls_name:<18}: {len(ids)} unique entities")

    elif model_type == "model_7_tactical_threat":
        print(f"\n{YELLOW}{BOLD}--- MODEL 7: TACTICAL WEAPON & PERSONNEL SEPARATION BREAKDOWN ---{RESET}")
        print(f" {BOLD}Total Unique People Tracked{RESET} : {CYAN}{len(tracked_person_ids)}{RESET}")
        print(f"   ├─ Safe Unarmed Personnel  : {GREEN}{len(tracked_person_ids) - len(armed_suspect_person_ids)}{RESET}")
        print(f"   └─ Armed Suspects Detected : {RED if armed_suspect_person_ids else GREEN}{len(armed_suspect_person_ids)}{RESET}")
        if armed_suspect_person_ids:
            print(f"       └─ Armed Suspect IDs   : {RED}{', '.join(sorted(armed_suspect_person_ids))}{RESET}")

        print(f" {BOLD}Total Unique Guns Tracked{RESET}   : {RED if tracked_gun_ids else GREEN}{len(tracked_gun_ids)}{RESET}")
        print(f"   ├─ In-Hand / Carried Guns  : {len(tracked_gun_ids) - len(unattended_gun_ids)}")
        print(f"   └─ Unattended / Drop Guns  : {RED if unattended_gun_ids else GREEN}{len(unattended_gun_ids)}{RESET}")
        print(f" {BOLD}Threat Alert Frames{RESET}        : {RED if threat_alert_frames > 0 else GREEN}{threat_alert_frames}{RESET}")

    elif model_type == "model_3_anomaly_sentinel":
        print(f"\n{YELLOW}{BOLD}--- MODEL 3: PERIMETER ANOMALY & BREACH SENTINEL BREAKDOWN ---{RESET}")
        total_analyzed = processed_frames
        anom_pct = (anomaly_alert_frames / total_analyzed * 100.0) if total_analyzed > 0 else 0.0
        norm_pct = (normal_frames_count / total_analyzed * 100.0) if total_analyzed > 0 else 0.0
        print(f" {BOLD}Total Frames Analyzed{RESET}       : {CYAN}{total_analyzed}{RESET} (Stride: {stride}x)")
        print(f" {BOLD}Normal / Secure Frames{RESET}      : {GREEN}{normal_frames_count} ({norm_pct:.1f}%){RESET}")
        print(f" {BOLD}Active Breach Frames{RESET}        : {RED if anomaly_alert_frames > 0 else GREEN}{anomaly_alert_frames} ({anom_pct:.1f}%){RESET}")
        print(f" {BOLD}Total Fence Climbers Detected{RESET}: {RED if detected_climber_ids else GREEN}{len(detected_climber_ids)}{RESET} unique suspect tracks")
        print(f" {BOLD}Normal Bystanders Filtered{RESET}   : {GREEN}{len(ignored_normal_ids)}{RESET} ignored entities (suppressed from alerts)")
        threat_level = "CRITICAL PERIMETER BREACH" if detected_climber_ids else "SECTOR CLEAR - NO INTRUDERS"
        color_t = RED if detected_climber_ids else GREEN
        print(f"\n {BOLD}Perimeter Threat Assessment{RESET} : {color_t}{threat_level}{RESET}")

    # Forensic Evidence Harvest Report
    print(f"\n{MAGENTA}{BOLD}--- BORDERGUARD AI FORENSIC EVIDENCE & SNAPSHOT HARVEST ---{RESET}")
    print(f" {BOLD}Run Evidence Package{RESET}  : {CYAN}{run_dir.resolve()}{RESET}")
    print(f" {BOLD}Primary Tested Video{RESET}  : {CYAN}{output_video_path.resolve()}{RESET}")
    if saved_evidence.get("highlight_video"):
        print(f" {BOLD}Highlight Video Clip{RESET}  : {GREEN}{saved_evidence['highlight_video']}{RESET}")
    if saved_evidence.get("caught_stamped_full"):
        print(f" {BOLD}Caught Suspect Frame{RESET}  : {RED}{saved_evidence['caught_stamped_full']}{RESET}")
    if saved_evidence.get("caught_face"):
        print(f" {BOLD}Caught Suspect Face{RESET}   : {RED}{saved_evidence['caught_face']}{RESET}")
    print(f" {BOLD}All Persons Harvested{RESET} : {CYAN}{len(saved_evidence['all_persons_faces'])} faces{RESET} & {CYAN}{len(saved_evidence['all_persons_bodies'])} bodies{RESET}")
    print(f"   ├─ Facial Snapshots Dir : {evidence_mgr.all_faces_dir.resolve()}")
    print(f"   └─ Body Snapshots Dir   : {evidence_mgr.all_bodies_dir.resolve()}")
    print(f" {BOLD}Incident Audit Report{RESET} : {YELLOW}{saved_evidence['incident_report']}{RESET}")
    print(f"{GREEN}{BOLD}====================================================================={RESET}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Test execution interrupted by user.{RESET}")
    except Exception as exc:
        print(f"\n{RED}ERROR: {exc}{RESET}")
        sys.exit(1)
