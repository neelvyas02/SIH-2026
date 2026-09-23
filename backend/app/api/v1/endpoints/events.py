from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.event import Event
from app.models.camera import Camera
from app.models.zone import Zone
from app.schemas.event import EventOut

router = APIRouter()


@router.get("", response_model=List[EventOut])
async def list_events(
    camera_id: Optional[str] = None,
    target_class: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves chronological security event audit trail."""
    query = select(Event).order_by(desc(Event.created_at)).limit(limit).offset(offset)

    if camera_id:
        query = query.where(Event.camera_id == camera_id)
    if target_class:
        query = query.where(Event.target_class == target_class)

    result = await db.execute(query)
    events = result.scalars().all()

    event_outs = []
    for ev in events:
        cam_res = await db.execute(select(Camera).where(Camera.id == ev.camera_id))
        camera = cam_res.scalars().first()

        zone_name = None
        if ev.zone_id:
            z_res = await db.execute(select(Zone).where(Zone.id == ev.zone_id))
            zone = z_res.scalars().first()
            if zone:
                zone_name = zone.name

        out = EventOut.model_validate(ev)
        out.camera_name = camera.name if camera else "Unknown"
        out.zone_name = zone_name
        event_outs.append(out)

    return event_outs


@router.get("/{event_id}", response_model=EventOut)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves full details and forensic bounding box data for an event."""
    result = await db.execute(select(Event).where(Event.id == event_id))
    ev = result.scalars().first()
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")

    cam_res = await db.execute(select(Camera).where(Camera.id == ev.camera_id))
    camera = cam_res.scalars().first()

    zone_name = None
    if ev.zone_id:
        z_res = await db.execute(select(Zone).where(Zone.id == ev.zone_id))
        zone = z_res.scalars().first()
        if zone:
            zone_name = zone.name

    out = EventOut.model_validate(ev)
    out.camera_name = camera.name if camera else "Unknown"
    out.zone_name = zone_name
    return out
