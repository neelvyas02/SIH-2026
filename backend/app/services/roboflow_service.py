import io
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
import numpy as np
from PIL import Image

from app.core.config import settings

logger = logging.getLogger("borderguard.roboflow_service")


class RoboflowService:
    """Roboflow Serverless Cloud API inference service."""

    def __init__(
        self,
        model_id: str = None,
        api_key: str = None,
        api_url: str = None,
    ):
        self.model_id = model_id or settings.ROBOFLOW_MODEL_ID
        self.api_key = api_key or settings.ROBOFLOW_API_KEY
        self.api_url = api_url or settings.ROBOFLOW_API_URL
        self.client = None
        self._init_client()

    def _init_client(self):
        """Initializes the Roboflow InferenceHTTPClient with header-based authorization."""
        if not self.api_key:
            logger.warning(
                "ROBOFLOW_API_KEY is not set. Cloud inference requests to Roboflow will require an API key."
            )
            return

        try:
            from inference_sdk import InferenceHTTPClient, InferenceConfiguration
            logger.info(f"Initializing Roboflow Inference Client (model: {self.model_id})...")
            self.client = InferenceHTTPClient(
                api_url=self.api_url,
                api_key=self.api_key
            ).configure(InferenceConfiguration(
                api_key_transport="header"  # Header-based auth (Bearer token in header)
            ))
            logger.info("Roboflow Client successfully initialized with header-based auth.")
        except Exception as e:
            logger.error(f"Failed to initialize Roboflow Client: {e}")
            self.client = None

    def is_configured(self) -> bool:
        """Returns True if the Roboflow client is configured with an API key."""
        return bool(self.api_key and self.client is not None)

    def detect_from_bytes(self, image_bytes: bytes, conf_threshold: float = 0.40) -> Dict[str, Any]:
        """
        Runs Roboflow object detection on raw JPEG/PNG image bytes.
        Converts center coordinates (x, y, w, h) to top-left format [x_min, y_min, w, h].
        """
        start_time = time.perf_counter()
        detections: List[Dict[str, Any]] = []

        if not self.is_configured():
            # If client was not initialized due to missing key, re-check in case settings updated
            if settings.ROBOFLOW_API_KEY and settings.ROBOFLOW_API_KEY != self.api_key:
                self.api_key = settings.ROBOFLOW_API_KEY
                self._init_client()

        if not self.is_configured():
            raise ValueError(
                "ROBOFLOW_API_KEY is not configured. Please set ROBOFLOW_API_KEY in .env or environment."
            )

        try:
            # Decode image to numpy array for inference-sdk
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(img)
            img_height, img_width = img_np.shape[:2]

            # Execute cloud serverless inference
            result = self.client.infer(img_np, model_id=self.model_id)
            raw_predictions = result.get("predictions", [])

            for pred in raw_predictions:
                confidence = float(pred.get("confidence", 0.0))
                if confidence < conf_threshold:
                    continue

                cls_name = pred.get("class", "person")
                x_center = float(pred.get("x", 0.0))
                y_center = float(pred.get("y", 0.0))
                box_w = float(pred.get("width", 0.0))
                box_h = float(pred.get("height", 0.0))

                # Convert center (x, y) to top-left (x_min, y_min)
                x_min = max(0, int(x_center - box_w / 2.0))
                y_min = max(0, int(y_center - box_h / 2.0))
                w = min(img_width - x_min, int(box_w))
                h = min(img_height - y_min, int(box_h))

                detections.append({
                    "class": cls_name,
                    "confidence": round(confidence, 3),
                    "bbox": [x_min, y_min, max(1, w), max(1, h)]
                })

        except Exception as e:
            logger.error(f"Error during Roboflow cloud inference: {e}")
            raise

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "inference_time_ms": round(elapsed_ms, 1),
            "model": self.model_id,
            "engine": "roboflow",
            "objects_count": len(detections),
            "detections": detections
        }


# Global singleton instance
roboflow_service = RoboflowService()
