from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.models.camera import Camera
from app.models.system_log import SystemLog
from app.schemas.internal import InternalEventPayload, CameraHealthPayload
from app.services.alert_service import process_incoming_ai_event
from app.api.websockets.alert_stream import ws_manager
import logging

logger = logging.getLogger("borderguard.internal_api")
router = APIRouter()


def verify_internal_secret(x_internal_secret: str = Header(None)):
    """Verifies that the incoming request originates from the trusted AI Engine process."""
    if not x_internal_secret or x_internal_secret != settings.AI_SERVICE_SECRET:
        logger.warning("Rejected unauthorized internal API call (secret mismatch).")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Invalid AI Service Secret"
        )
    return True


@router.post("/events", status_code=status.HTTP_201_CREATED)
async def receive_ai_event(
    payload: InternalEventPayload,
    db: AsyncSession = Depends(get_db),
    authorized: bool = Depends(verify_internal_secret)
):
    """Webhook called by AI Engine when a verified zone intrusion or security event is triggered."""
    alert = await process_incoming_ai_event(db, payload)
    return {
        "status": "success",
        "alert_id": alert.id,
        "event_id": alert.event_id,
        "action": "dispatched"
    }


@router.post("/camera-health")
async def update_camera_health(
    payload: CameraHealthPayload,
    db: AsyncSession = Depends(get_db),
    authorized: bool = Depends(verify_internal_secret)
):
    """Webhook called by AI Engine when an RTSP stream drops, times out, or reconnects."""
    cam_res = await db.execute(select(Camera).where(Camera.id == payload.camera_id))
    camera = cam_res.scalars().first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    camera.status = payload.status
    
    # Log system event
    log_entry = SystemLog(
        service_name="ai_engine.camera_worker",
        level="WARNING" if payload.status != "online" else "INFO",
        message=f"Camera '{camera.name}' status updated to '{payload.status}'. {payload.error_message or ''}",
        details={"camera_id": camera.id, "error_code": payload.error_code}
    )
    db.add(log_entry)
    await db.commit()

    # Broadcast camera status update to all connected clients
    await ws_manager.broadcast({
        "type": "CAMERA_STATUS_CHANGED",
        "data": {
            "camera_id": camera.id,
            "status": camera.status,
            "error_code": payload.error_code,
            "error_message": payload.error_message
        }
    })

    return {"status": "updated", "camera_id": camera.id, "current_status": camera.status}
