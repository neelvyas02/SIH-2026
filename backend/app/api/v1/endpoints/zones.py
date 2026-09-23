import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.zone import Zone
from app.models.camera import Camera
from app.schemas.zone import ZoneBase, ZoneOut, ZoneCreate, ZoneUpdate
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("/zones", response_model=List[ZoneOut])
async def list_all_zones(db: AsyncSession = Depends(get_db)):
    """Retrieves all defined restricted polygon zones across all cameras."""
    result = await db.execute(select(Zone))
    zones = result.scalars().all()
    return [ZoneOut.model_validate(z) for z in zones]


@router.get("/cameras/{camera_id}/zones", response_model=List[ZoneOut])
async def list_zones_for_camera(camera_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves all defined restricted polygon zones for a specific camera."""
    result = await db.execute(select(Zone).where(Zone.camera_id == camera_id))
    zones = result.scalars().all()
    return [ZoneOut.model_validate(z) for z in zones]


@router.post("/cameras/{camera_id}/zones", response_model=ZoneOut, status_code=status.HTTP_201_CREATED)
async def create_zone_for_camera(
    camera_id: str,
    zone_in: ZoneBase,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Adds a new restricted zone polygon to a camera feed."""
    cam_result = await db.execute(select(Camera).where(Camera.id == camera_id))
    if not cam_result.scalars().first():
        raise HTTPException(status_code=404, detail="Camera not found")

    zone = Zone(
        id=str(uuid.uuid4()),
        camera_id=camera_id,
        **zone_in.model_dump()
    )
    db.add(zone)
    await db.commit()
    await db.refresh(zone)
    return ZoneOut.model_validate(zone)


@router.put("/zones/{zone_id}", response_model=ZoneOut)
async def update_zone(
    zone_id: str,
    zone_in: ZoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Modifies zone coordinates, name, severity, or dwell threshold."""
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalars().first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    for field, val in zone_in.model_dump(exclude_unset=True).items():
        setattr(zone, field, val)

    await db.commit()
    await db.refresh(zone)
    return ZoneOut.model_validate(zone)


@router.delete("/zones/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_zone(
    zone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Deletes a restricted zone."""
    result = await db.execute(select(Zone).where(Zone.id == zone_id))
    zone = result.scalars().first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")

    await db.delete(zone)
    await db.commit()
    return None
