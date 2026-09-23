from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CameraBase(BaseModel):
    name: str
    location: str
    stream_url: str
    stream_type: str = "rtsp"  # 'rtsp', 'mjpeg', 'mock_video'
    resolution: Optional[str] = "1920x1080"
    fps: int = 25
    status: str = "online"  # 'online', 'offline', 'degraded'
    is_active: bool = True


class CameraCreate(CameraBase):
    pass


class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    stream_url: Optional[str] = None
    stream_type: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None


class CameraOut(CameraBase):
    id: str
    created_at: datetime
    updated_at: datetime
    zone_count: Optional[int] = 0
    model_config = ConfigDict(from_attributes=True)

