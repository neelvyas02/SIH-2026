import os
import shutil
import tempfile
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, UploadFile, File, Form, Query, HTTPException, status
from fastapi.responses import StreamingResponse, JSONResponse
from app.services.ai_engine_manager import ai_engine_manager
import logging

logger = logging.getLogger("borderguard.ai_engine_api")
router = APIRouter()


class StartEngineRequest(BaseModel):
    source: str = Field(default="0", description="Video source: '0' for webcam, file path, RTSP URL, or YouTube URL")
    model_name: str = Field(default="best.pt", description="Model filename from ai-engine/models")
    conf_thresh: float = Field(default=0.25, ge=0.05, le=0.95, description="Confidence threshold")
    iou_thresh: float = Field(default=0.45, ge=0.1, le=0.9, description="IoU threshold for NMS")
    use_pose: bool = Field(default=False, description="Enable YOLOv8-pose keypoint wrist proximity association")
    enable_tracking: bool = Field(default=True, description="Enable ByteTrack temporal tracking")
    enable_iff: bool = Field(default=True, description="Enable IFF friend-or-foe camouflage classification")
    save_evidence: bool = Field(default=True, description="Automatically capture forensic snapshots and dispatch alerts")


@router.get("/status", status_code=status.HTTP_200_OK)
async def get_engine_status():
    """Returns real-time operational status, FPS, telemetry counters, and active detections."""
    return ai_engine_manager.get_status()


@router.get("/models", status_code=status.HTTP_200_OK)
async def get_available_models():
    """Discovers and returns all available YOLO models in ai-engine/models with metadata."""
    return ai_engine_manager.get_available_models()


@router.post("/start", status_code=status.HTTP_200_OK)
async def start_engine(req: StartEngineRequest):
    """
    Activates the AI Engine stream worker without touching the terminal.
    Loads selected weights, opens video source, and begins real-time inference.
    """
    result = ai_engine_manager.start(
        source=req.source,
        model_name=req.model_name,
        conf_thresh=req.conf_thresh,
        iou_thresh=req.iou_thresh,
        use_pose=req.use_pose,
        enable_tracking=req.enable_tracking,
        enable_iff=req.enable_iff,
        save_evidence=req.save_evidence
    )
    return result


@router.post("/stop", status_code=status.HTTP_200_OK)
async def stop_engine():
    """Terminates the running AI Engine stream worker and releases video capture hardware."""
    result = ai_engine_manager.stop()
    return result


@router.get("/stream")
async def live_video_stream():
    """
    High-speed, low-latency multipart/x-mixed-replace MJPEG stream of the AI annotated video.
    Can be directly embedded in the browser UI via standard <img src="/api/v1/ai-engine/stream">.
    """
    return StreamingResponse(
        ai_engine_manager.generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@router.get("/logs", status_code=status.HTTP_200_OK)
async def get_engine_logs(limit: int = Query(50, ge=1, le=200)):
    """Returns live terminal stdout/stderr logs from the AI Engine ring buffer."""
    return {
        "logs": ai_engine_manager.get_logs(limit=limit)
    }


@router.post("/detect-frame", status_code=status.HTTP_200_OK)
async def detect_frame(
    file: UploadFile = File(...),
    model_name: Optional[str] = Query(None, description="Optional specific model to use"),
    conf_thresh: float = Query(0.25, ge=0.05, le=0.95),
    use_pose: bool = Query(False)
):
    """
    Processes an individual image frame (e.g. sent directly from browser webcam via canvas)
    with the user's AI Engine models, person-weapon association, and IFF.
    Returns annotated base64 frame, detections list, and threat status.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No frame payload provided.")

    try:
        image_bytes = await file.read()
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty frame received.")

        result = ai_engine_manager.process_single_frame(
            image_bytes=image_bytes,
            model_name=model_name,
            conf_thresh=conf_thresh,
            use_pose=use_pose
        )
        return result
    except Exception as e:
        logger.error(f"Frame processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.post("/upload-media", status_code=status.HTTP_200_OK)
async def upload_and_analyze_media(
    file: UploadFile = File(...),
    model_name: Optional[str] = Form("best.pt"),
    conf_thresh: float = Form(0.25),
    use_pose: bool = Form(False)
):
    """
    Allows user to upload an image or video directly from the browser without terminal,
    saves it to temporary/storage directory, and starts AI analysis on it.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No media file provided.")

    filename = file.filename or "uploaded_media.mp4"
    is_image = filename.lower().endswith((".jpg", ".jpeg", ".png", ".bmp", ".webp"))

    upload_dir = os.path.join(tempfile.gettempdir(), "borderguard_uploads")
    os.makedirs(upload_dir, exist_ok=True)
    temp_path = os.path.join(upload_dir, filename)

    try:
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        if is_image:
            # Single image analysis
            result = ai_engine_manager.process_single_frame(
                image_bytes=content,
                model_name=model_name,
                conf_thresh=conf_thresh,
                use_pose=use_pose
            )
            result["file_type"] = "image"
            result["filename"] = filename
            return result
        else:
            # Video file: start engine with this video source
            start_result = ai_engine_manager.start(
                source=temp_path,
                model_name=model_name or "best.pt",
                conf_thresh=conf_thresh,
                use_pose=use_pose
            )
            return {
                "file_type": "video",
                "filename": filename,
                "message": "Video uploaded successfully. AI Engine streaming active.",
                "start_details": start_result
            }
    except Exception as e:
        logger.error(f"Error handling media upload: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
