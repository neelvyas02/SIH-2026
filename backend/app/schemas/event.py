from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EventBase(BaseModel):
    camera_id: str
    zone_id: Optional[str] = None
    track_id: int
    event_type: str = "zone_intrusion"
    target_class: str
    confidence_score: float
    bounding_box: Dict[str, Any]
    start_time: datetime
    end_time: Optional[datetime] = None


class EventCreate(EventBase):
    pass


class EventOut(EventBase):
    id: str
    created_at: datetime
    camera_name: Optional[str] = None
    zone_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

