from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlertBase(BaseModel):
    event_id: str
    camera_id: str
    severity: str  # 'critical', 'high', 'medium', 'low'
    title: str
    description: str
    status: str = "new"  # 'new', 'acknowledged', 'resolved', 'dismissed'


class AlertAcknowledgeRequest(BaseModel):
    notes: Optional[str] = None


class AlertResolveRequest(BaseModel):
    resolution_notes: str


class AlertOut(AlertBase):
    id: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    camera_name: Optional[str] = None
    thumbnail_url: Optional[str] = None
    acknowledged_by_name: Optional[str] = None
    resolved_by_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

