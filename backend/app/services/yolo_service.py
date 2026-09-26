import io
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
import numpy as np

logger = logging.getLogger("borderguard.yolo_service")


class YOLOService:
    """Ultralytics YOLOv8 real-time inference service."""

    def __init__(self, model_name: str = "yolov8n.pt", conf_threshold: float = 0.45):
        self.model_name = model_name
        self.conf_threshold = conf_threshold
        self.model = None
        self._init_model()

    def _init_model(self):
        try:
            from ultralytics import YOLO
            from pathlib import Path
            ai_best = Path(__file__).resolve().parent.parent.parent.parent / "ai-engine" / "models" / "best.pt"
            b_best = Path(__file__).resolve().parent.parent.parent / "best.pt"
            resolved = str(ai_best) if ai_best.exists() else (str(b_best) if b_best.exists() else self.model_name)
            logger.info(f"Loading YOLO model: {resolved}...")
            self.model = YOLO(resolved)
            logger.info(f"YOLO model ({resolved}) successfully loaded into memory.")
        except Exception as e:
            logger.warning(f"Could not load Ultralytics YOLO ({e}). Engaging fallback inference.")
            self.model = None

    def detect_from_bytes(self, image_bytes: bytes) -> Dict[str, Any]:
        """Runs YOLO object detection on raw JPEG/PNG image bytes."""
        start_time = time.perf_counter()
        detections: List[Dict[str, Any]] = []

        try:
            from PIL import Image
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(img)
            height, width = img_np.shape[:2]

            if self.model is not None:
                results = self.model(img_np, conf=self.conf_threshold, verbose=False)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0])
                        conf = float(box.conf[0])
                        cls_name = self.model.names.get(cls_id, f"class_{cls_id}")
                        coords = box.xyxy[0].tolist()

                        x1 = max(0, int(coords[0]))
                        y1 = max(0, int(coords[1]))
                        x2 = min(width, int(coords[2]))
                        y2 = min(height, int(coords[3]))

                        detections.append({
                            "class": cls_name,
                            "confidence": round(conf, 3),
                            "bbox": [x1, y1, max(1, x2 - x1), max(1, y2 - y1)]  # [x, y, w, h]
                        })

        except Exception as e:
            logger.error(f"Error during image decoding / inference: {e}")

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "inference_time_ms": round(elapsed_ms, 1),
            "objects_count": len(detections),
            "detections": detections
        }


# Global singleton instance
yolo_service = YOLOService(model_name="best.pt", conf_threshold=0.25)

