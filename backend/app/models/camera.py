import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base


class Camera(Base):
    __tablename__ = "cameras"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    location = Column(String(150), nullable=False)
    stream_url = Column(String(500), nullable=False)
    stream_type = Column(String(20), nullable=False, default="rtsp")  # 'rtsp', 'mjpeg', 'mock_video'
    resolution = Column(String(20), default="1920x1080")
    fps = Column(Integer, nullable=False, default=25)
    status = Column(String(20), nullable=False, default="online")  # 'online', 'offline', 'degraded'
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    zones = relationship("Zone", back_populates="camera", cascade="all, delete-orphan", lazy="selectin")
    events = relationship("Event", back_populates="camera", cascade="all, delete-orphan", lazy="selectin")
