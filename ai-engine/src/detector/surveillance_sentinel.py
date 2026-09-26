"""
BorderGuard AI - Dedicated Surveillance Sentinel Detector Module
Designed for anomaly detection, weapon recognition, and suspicious activity analysis on CCTV feeds.
"""

import os
from pathlib import Path
import numpy as np
import logging

logger = logging.getLogger("borderguard.surveillance_sentinel")

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"


class SurveillanceSentinelDetector:
    """Dedicated Surveillance Model Detector for testing and inference on CCTV & Border feeds."""

    def __init__(self, weights_path: str = None, conf_thresh: float = 0.35, iou_thresh: float = 0.45):
        if weights_path is None:
            sentinel_weights = MODELS_DIR / "surveillance_sentinel.pt"
            if sentinel_weights.exists():
                weights_path = str(sentinel_weights)
            elif (MODELS_DIR / "best.pt").exists():
                weights_path = str(MODELS_DIR / "best.pt")
            else:
                weights_path = "yolov8m.pt"

        self.weights_path = weights_path
        self.conf_thresh = conf_thresh
        self.iou_thresh = iou_thresh
        self.model = None
        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            logger.info(f"Loading Surveillance Sentinel Model weights: {self.weights_path}")
            self.model = YOLO(self.weights_path)
            logger.info("[+] Surveillance Sentinel Model loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load Surveillance Sentinel Model: {e}")

    def detect_anomalies(self, frame: np.ndarray) -> list:
        """Runs anomaly detection on input frame and returns structured detections."""
        if self.model is None:
            return []

        results = self.model(frame, conf=self.conf_thresh, iou=self.iou_thresh, verbose=False)
        detections = []

        for r in results:
            for box in r.boxes:
                coords = box.xyxy[0].cpu().numpy().astype(int)
                conf = float(box.conf[0].cpu())
                cls_id = int(box.cls[0].cpu())
                cls_name = self.model.names.get(cls_id, f"anomaly_{cls_id}").lower()

                detections.append({
                    "bbox": coords,
                    "confidence": conf,
                    "class_name": cls_name,
                    "is_anomaly": cls_name not in ["normal", "person"]
                })

        return detections
