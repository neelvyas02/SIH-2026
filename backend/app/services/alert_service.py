import uuid
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Event, Alert, Evidence, Camera, Zone, User
from app.schemas.internal import InternalEventPayload
from app.api.websockets.alert_stream import ws_manager

logger = logging.getLogger("borderguard.alert_service")


async def process_incoming_ai_event(db: AsyncSession, payload: InternalEventPayload) -> Alert:
    """Processes an event payload sent by the AI engine, saves records, and dispatches a WebSocket alert."""
    
    # 1. Fetch Camera
    cam_result = await db.execute(select(Camera).where(Camera.id == payload.camera_id))
    camera = cam_result.scalars().first()
    camera_name = camera.name if camera else "Unknown Camera"

    # 2. Fetch Zone if provided
    zone_name = None
    severity = "high"
    if payload.zone_id:
        zone_result = await db.execute(select(Zone).where(Zone.id == payload.zone_id))
        zone = zone_result.scalars().first()
        if zone:
            zone_name = zone.name
            severity = zone.severity_level

    # 3. Create Event Record
    event_id = str(uuid.uuid4())
    event = Event(
        id=event_id,
        camera_id=payload.camera_id,
        zone_id=payload.zone_id,
        track_id=payload.track_id,
        event_type=payload.event_type,
        target_class=payload.target_class,
        confidence_score=payload.confidence_score,
        bounding_box=payload.bounding_box.model_dump(),
        start_time=payload.timestamp or datetime.now(timezone.utc)
    )
    db.add(event)

    # 4. Create Evidence Record if present
    thumbnail_url = None
    if payload.evidence:
        evidence_id = str(uuid.uuid4())
        evidence = Evidence(
            id=evidence_id,
            event_id=event_id,
            file_path=payload.evidence.relative_path,
            file_type="image_snapshot",
            sha256_hash=payload.evidence.sha256_hash
        )
        db.add(evidence)
        thumbnail_url = f"/static/evidence/{payload.evidence.relative_path}"

    # 5. Create Actionable Alert
    title = f"{severity.upper()} {payload.event_type.replace('_', ' ').title()}: {zone_name or camera_name}"
    description = (
        f"Detected {payload.target_class.upper()} (Track #{payload.track_id}) with "
        f"{int(payload.confidence_score * 100)}% confidence in sector '{camera_name}'. "
        f"Dwell duration: {payload.dwell_duration_seconds:.1f}s."
    )

    alert_id = str(uuid.uuid4())
    alert = Alert(
        id=alert_id,
        event_id=event_id,
        camera_id=payload.camera_id,
        severity=severity,
        title=title,
        description=description,
        status="new"
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)

    # 6. Real-Time WebSocket Broadcast
    broadcast_payload = {
        "type": "NEW_ALERT",
        "data": {
            "alert_id": alert.id,
            "event_id": event.id,
            "camera_id": payload.camera_id,
            "camera_name": camera_name,
            "zone_id": payload.zone_id,
            "zone_name": zone_name,
            "track_id": payload.track_id,
            "target_class": payload.target_class,
            "confidence": payload.confidence_score,
            "severity": severity,
            "title": title,
            "description": description,
            "status": "new",
            "created_at": alert.created_at.isoformat(),
            "thumbnail_url": thumbnail_url
        }
    }
    await ws_manager.broadcast(broadcast_payload)
    logger.info(f"Dispatched real-time alert {alert.id} via WebSocket.")

    return alert
