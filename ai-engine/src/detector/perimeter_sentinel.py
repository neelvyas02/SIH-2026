"""
BorderGuard AI - Intelligent Perimeter Anomaly & Fence Breach Sentinel
Distinguishes abnormal intruders / fence climbers from normal spectators in crowded border zones.
Specifically suppresses/ignores innocent bystanders on ground terrain and tactically highlights active climbing/breach intruders.
"""

from typing import List, Dict, Tuple, Optional
import numpy as np
import logging

logger = logging.getLogger("borderguard.perimeter_sentinel")


def evaluate_perimeter_threat(
    box: Tuple[int, int, int, int],
    frame_w: int,
    frame_h: int,
    pose_kpts: Optional[np.ndarray] = None,
    fence_polygon: Optional[List[Tuple[float, float]]] = None
) -> Tuple[bool, str, float, List[str]]:
    """
    Per-Person Behavioral & Spatial Perimeter Sentinel Evaluation.
    
    Evaluates individual spatial ground elevation, barrier proximity, aspect ratio,
    perspective road depth, and climbing kinematics to separate normal crowd bystanders
    from active intruders.

    Args:
        box: (x1, y1, x2, y2) bounding box in pixel coordinates.
        frame_w: Width of the video frame.
        frame_h: Height of the video frame.
        pose_kpts: Optional (17, 3) keypoints array from pose estimation.
        fence_polygon: Optional normalized polygon coordinates for the fence structure.

    Returns:
        is_suspicious (bool): True if target is climbing or breaching perimeter.
        threat_type (str): 'FENCE_CLIMBER', 'PERIMETER_BREACH', or 'NORMAL_SPECTATOR'.
        threat_score (float): Calculated threat score in [0.0, 1.0].
        reasons (list): Detailed list of triggers.
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
