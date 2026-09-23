from typing import List, Dict, Any
import numpy as np
import logging

logger = logging.getLogger("borderguard.detector")


class Detection:
    def __init__(self, x1: float, y1: float, x2: float, y2: float, confidence: float, class_id: int, class_name: str):
        self.x1 = float(x1)
        self.y1 = float(y1)
        self.x2 = float(x2)
        self.y2 = float(y2)
        self.confidence = float(confidence)
        self.class_id = int(class_id)
        self.class_name = str(class_name)

    @property
    def bbox_xywh(self) -> Dict[str, int]:
        return {
            "x_min": int(self.x1),
            "y_min": int(self.y1),
            "width": int(self.x2 - self.x1),
            "height": int(self.y2 - self.y1)
        }

    @property
    def ground_anchor(self) -> tuple:
        """Bottom-center point (x_center, y_bottom) representing ground terrain contact."""
        return ((self.x1 + self.x2) / 2.0, self.y2)


class YOLODetector:
    """Wrapper around YOLOv8 inference with class filtering and fallback support."""

    def __init__(self, model_path: str = "yolov8n.pt", conf_thresh: float = 0.50):
        self.model_path = model_path
        self.conf_thresh = conf_thresh
        self.model = None
        self.use_fallback = False

        self._load_model()

    def _load_model(self):
        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLO model from {self.model_path}...")
            self.model = YOLO(self.model_path)
            logger.info("YOLO model successfully initialized.")
        except Exception as e:
            logger.warning(f"Could not initialize Ultralytics YOLO ({e}). Engaging internal heuristic detector for mock mode.")
            self.use_fallback = True

    def detect(self, frame: np.ndarray) -> List[Detection]:
        """Runs detection on an input BGR frame and returns filtered detections."""
        if self.use_fallback or self.model is None:
            return self._heuristic_fallback_detect(frame)

        h, w = frame.shape[:2]
        try:
            results = self.model(frame, conf=self.conf_thresh, verbose=False)
            detections = []
            
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    # COCO: 0=person, 2=car, 5=bus, 7=truck, 16=dog
                    if cls_id in [0, 2, 5, 7, 16]:
                        coords = box.xyxy[0].tolist()
                        cls_name = "person" if cls_id == 0 else ("animal" if cls_id == 16 else "vehicle")
                        detections.append(Detection(
                            x1=coords[0],
                            y1=coords[1],
                            x2=coords[2],
                            y2=coords[3],
                            confidence=conf,
                            class_id=cls_id,
                            class_name=cls_name
                        ))
            return detections
        except Exception as e:
            logger.error(f"Error during YOLO inference: {e}. Using fallback.")
            return self._heuristic_fallback_detect(frame)

    def _heuristic_fallback_detect(self, frame: np.ndarray) -> List[Detection]:
        """Detects the silhouette intruder in the synthetic test frame for demonstration."""
        h, w = frame.shape[:2]
        # In synthetic frame, look for the moving target silhouette (dark pixels below horizon)
        ground_y = int(h * 0.45)
        roi = frame[ground_y:, :]
        gray = np.mean(roi, axis=2).astype(np.uint8)
        
        # Threshold for dark intruder silhouette (< 35)
        mask = (gray < 35).astype(np.uint8) * 255
        
        detections = []
        try:
            import cv2
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if 400 < area < 40000:
                    bx, by, bw, bh = cv2.boundingRect(cnt)
                    by += ground_y
                    detections.append(Detection(
                        x1=bx,
                        y1=by,
                        x2=bx + bw,
                        y2=by + bh,
                        confidence=0.89,
                        class_id=0,
                        class_name="person"
                    ))
        except Exception:
            pass

        return detections
