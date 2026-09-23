from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.alert import Alert
from app.models.camera import Camera
from app.models.event import Event
from app.models.evidence import Evidence
from app.models.user import User
from app.schemas.alert import AlertOut, AlertAcknowledgeRequest, AlertResolveRequest
from app.api.v1.endpoints.auth import get_current_user
from app.api.websockets.alert_stream import ws_manager

router = APIRouter()


@router.get("", response_model=List[AlertOut])
async def list_alerts(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = None,
    camera_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves a paginated list of security alerts for the SOC triage queue."""
    query = select(Alert).order_by(desc(Alert.created_at)).limit(limit).offset(offset)

    if status_filter:
        query = query.where(Alert.status == status_filter)
    if severity:
        query = query.where(Alert.severity == severity)
    if camera_id:
        query = query.where(Alert.camera_id == camera_id)

    result = await db.execute(query)
    alerts = result.scalars().all()

    alert_outs = []
    for a in alerts:
        # Load associated camera
        cam_res = await db.execute(select(Camera).where(Camera.id == a.camera_id))
        camera = cam_res.scalars().first()
        camera_name = camera.name if camera else "Unknown"

        # Load evidence thumbnail
        ev_res = await db.execute(select(Evidence).where(Evidence.event_id == a.event_id))
        evidence = ev_res.scalars().first()
        thumb = f"/static/evidence/{evidence.file_path}" if evidence else None

        # Load user names if acknowledged/resolved
        ack_name = None
        if a.acknowledged_by:
            u_res = await db.execute(select(User).where(User.id == a.acknowledged_by))
            u = u_res.scalars().first()
            ack_name = u.full_name if u else None

        res_name = None
        if a.resolved_by:
            u_res = await db.execute(select(User).where(User.id == a.resolved_by))
            u = u_res.scalars().first()
            res_name = u.full_name if u else None

        out = AlertOut.model_validate(a)
        out.camera_name = camera_name
        out.thumbnail_url = thumb
        out.acknowledged_by_name = ack_name
        out.resolved_by_name = res_name
        alert_outs.append(out)

    return alert_outs


@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves full details of a specific security alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    cam_res = await db.execute(select(Camera).where(Camera.id == alert.camera_id))
    camera = cam_res.scalars().first()

    ev_res = await db.execute(select(Evidence).where(Evidence.event_id == alert.event_id))
    evidence = ev_res.scalars().first()

    out = AlertOut.model_validate(alert)
    out.camera_name = camera.name if camera else "Unknown"
    out.thumbnail_url = f"/static/evidence/{evidence.file_path}" if evidence else None
    return out


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
async def acknowledge_alert(
    alert_id: str,
    body: Optional[AlertAcknowledgeRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Operator claims ownership of an active alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "acknowledged"
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.now(timezone.utc)
    if body and body.notes:
        alert.description += f" [Note: {body.notes}]"

    await db.commit()
    await db.refresh(alert)

    # Broadcast status change
    await ws_manager.broadcast({
        "type": "ALERT_ACKNOWLEDGED",
        "data": {
            "alert_id": alert.id,
            "status": "acknowledged",
            "acknowledged_by": current_user.full_name,
            "acknowledged_at": alert.acknowledged_at.isoformat()
        }
    })

    out = AlertOut.model_validate(alert)
    out.acknowledged_by_name = current_user.full_name
    return out


@router.post("/{alert_id}/resolve", response_model=AlertOut)
async def resolve_alert(
    alert_id: str,
    body: AlertResolveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marks an alert incident as resolved with operator notes."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalars().first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "resolved"
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.now(timezone.utc)
    alert.resolution_notes = body.resolution_notes

    await db.commit()
    await db.refresh(alert)

    # Broadcast status change
    await ws_manager.broadcast({
        "type": "ALERT_RESOLVED",
        "data": {
            "alert_id": alert.id,
            "status": "resolved",
            "resolved_by": current_user.full_name,
            "resolution_notes": alert.resolution_notes,
            "resolved_at": alert.resolved_at.isoformat()
        }
    })

    out = AlertOut.model_validate(alert)
    out.resolved_by_name = current_user.full_name
    return out
