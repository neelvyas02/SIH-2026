import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String(36), ForeignKey("cameras.id", ondelete="CASCADE"), nullable=False, index=True)
    zone_id = Column(String(36), ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    track_id = Column(Integer, nullable=False)
    event_type = Column(String(50), nullable=False, default="zone_intrusion")
    target_class = Column(String(30), nullable=False)  # 'person', 'vehicle', 'animal'
    confidence_score = Column(Float, nullable=False)
    bounding_box = Column(JSON, nullable=False)  # {x_min, y_min, width, height}
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    camera = relationship("Camera", back_populates="events")
    zone = relationship("Zone", back_populates="events")
    alerts = relationship("Alert", back_populates="event", cascade="all, delete-orphan", lazy="selectin")
    evidence_items = relationship("Evidence", back_populates="event", cascade="all, delete-orphan", lazy="selectin")
