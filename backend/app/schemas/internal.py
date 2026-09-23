from typing import Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class BoundingBox(BaseModel):
    x_min: int
    y_min: int
    width: int
    height: int


class GroundPoint(BaseModel):
    x_norm: float
    y_norm: float


class EvidencePayload(BaseModel):
    snapshot_filename: str
    relative_path: str
    sha256_hash: str
    snapshot_base64: Optional[str] = None


class InternalEventPayload(BaseModel):
    event_type: str = "zone_intrusion"  # 'zone_intrusion', 'loitering', 'camera_status_change'
    camera_id: str
    zone_id: Optional[str] = None
    track_id: int
    target_class: str
    confidence_score: float
    bounding_box: BoundingBox
    ground_point: Optional[GroundPoint] = None
    dwell_duration_seconds: float = 0.0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    evidence: Optional[EvidencePayload] = None


class CameraHealthPayload(BaseModel):
    camera_id: str
    status: str  # 'online', 'offline', 'degraded'
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

