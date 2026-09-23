import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.camera import Camera
from app.models.zone import Zone
from app.schemas.camera import CameraOut, CameraCreate, CameraUpdate
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


@router.get("", response_model=List[CameraOut])
async def list_cameras(db: AsyncSession = Depends(get_db)):
    """Retrieves all registered CCTV streams and their active zone counts."""
    result = await db.execute(select(Camera).order_by(Camera.created_at.desc()))
    cameras = result.scalars().all()

    camera_outs = []
    for cam in cameras:
        zone_count_res = await db.execute(select(func.count(Zone.id)).where(Zone.camera_id == cam.id))
        count = zone_count_res.scalar() or 0
        cam_out = CameraOut.model_validate(cam)
        cam_out.zone_count = count
        camera_outs.append(cam_out)

    return camera_outs


@router.post("", response_model=CameraOut, status_code=status.HTTP_201_CREATED)
async def create_camera(
    camera_in: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Registers a new surveillance camera stream."""
    camera = Camera(
        id=str(uuid.uuid4()),
        **camera_in.model_dump()
    )
    db.add(camera)
    await db.commit()
    await db.refresh(camera)
    cam_out = CameraOut.model_validate(camera)
    cam_out.zone_count = 0
    return cam_out


@router.get("/{camera_id}", response_model=CameraOut)
async def get_camera(camera_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves a specific camera stream by ID."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalars().first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    zone_count_res = await db.execute(select(func.count(Zone.id)).where(Zone.camera_id == camera.id))
    cam_out = CameraOut.model_validate(camera)
    cam_out.zone_count = zone_count_res.scalar() or 0
    return cam_out


@router.put("/{camera_id}", response_model=CameraOut)
async def update_camera(
    camera_id: str,
    camera_in: CameraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Updates camera metadata, status, or stream URL."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalars().first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    update_data = camera_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(camera, field, val)

    await db.commit()
    await db.refresh(camera)
    return CameraOut.model_validate(camera)


@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(
    camera_id: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Deactivates and removes a camera stream."""
    result = await db.execute(select(Camera).where(Camera.id == camera_id))
    camera = result.scalars().first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    await db.delete(camera)
    await db.commit()
    return None
