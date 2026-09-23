from datetime import datetime, timezone
from sqlalchemy import Column, BigInteger, String, Text, DateTime, JSON
from app.core.database import Base


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    service_name = Column(String(50), nullable=False)
    level = Column(String(15), nullable=False)  # 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    message = Column(Text, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
