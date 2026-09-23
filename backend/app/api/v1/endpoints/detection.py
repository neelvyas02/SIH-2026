from typing import Optional
from fastapi import APIRouter, UploadFile, File, Query, HTTPException, status
from app.core.config import settings
from app.services.yolo_service import yolo_service
from app.services.roboflow_service import roboflow_service
import logging

logger = logging.getLogger("borderguard.detection_api")
router = APIRouter()


@router.post("", status_code=status.HTTP_200_OK)
async def detect_objects(
    file: UploadFile = File(...),
    engine: Optional[str] = Query(
        None,
        description="Inference engine to use: 'yolo' (local Ultralytics) or 'roboflow' (Serverless Cloud API)"
    )
):
    """
    Receives a video frame from the browser webcam, executes real-time object detection,
    and returns normalized bounding boxes, confidence scores, and detection metadata.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No video frame provided.")

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty frame payload received.")

        selected_engine = (engine or settings.DETECTION_ENGINE or "yolo").lower().strip()

        if selected_engine == "roboflow":
            if not roboflow_service.is_configured():
                raise HTTPException(
                    status_code=400,
                    detail="Roboflow engine requested, but ROBOFLOW_API_KEY is not configured in .env or environment."
                )
            result = roboflow_service.detect_from_bytes(image_bytes)
        else:
            result = yolo_service.detect_from_bytes(image_bytes)

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
