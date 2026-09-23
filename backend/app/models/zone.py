import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    zone_type = Column(String(30), nullable=False, default="restricted")  # 'restricted', 'buffer', 'entry_point'
    polygon_coordinates = Column(JSON, nullable=False)  # [[x1, y1], [x2, y2], ...] normalized [0, 1]
    severity_level = Column(String(20), nullable=False, default="high")  # 'critical', 'high', 'medium', 'low'
    dwell_time_threshold = Column(Integer, nullable=False, default=2)  # seconds before alerting
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    camera = relationship("Camera", back_populates="zones")
    events = relationship("Event", back_populates="zone", lazy="selectin")
