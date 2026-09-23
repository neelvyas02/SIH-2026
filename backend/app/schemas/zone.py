from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ZoneBase(BaseModel):
    name: str
    zone_type: str = "restricted"  # 'restricted', 'buffer', 'entry_point'
    polygon_coordinates: List[List[float]] = Field(
        ...,
        description="List of [x, y] coordinates normalized between 0.0 and 1.0"
    )
    severity_level: str = "high"  # 'critical', 'high', 'medium', 'low'
    dwell_time_threshold: int = 2  # in seconds
    is_active: bool = True


class ZoneCreate(ZoneBase):
    camera_id: str


class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    zone_type: Optional[str] = None
    polygon_coordinates: Optional[List[List[float]]] = None
    severity_level: Optional[str] = None
    dwell_time_threshold: Optional[int] = None
    is_active: Optional[bool] = None


class ZoneOut(ZoneBase):
    id: str
    camera_id: str
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)

