from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger("borderguard.database")

# Resolve database URL (fallback to local SQLite if empty)
db_url = settings.DATABASE_URL.strip() if settings.DATABASE_URL and settings.DATABASE_URL.strip() else "sqlite+aiosqlite:///./borderguard.db"

# Normalize postgresql:// or postgres:// to async driver postgresql+asyncpg://
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

# SQLite needs connect_args check_same_thread=False
connect_args = {}
if "sqlite" in db_url:
    connect_args["check_same_thread"] = False
elif "supabase.co" in db_url or "pooler.supabase.com" in db_url:
    connect_args["ssl"] = "require"

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args=connect_args
)

# Create sessionmaker
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection yield for FastAPI request lifecycle."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initializes schema and seeds default operational data if empty."""
    from app.models import User, Camera, Zone, Alert, Event, Evidence
    from app.core.security import get_password_hash
    import uuid
    from datetime import datetime, timezone, timedelta

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed initial data if users table is empty
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        result = await session.execute(select(User))
        first_user = result.scalars().first()

        if not first_user:
            logger.info("Database is clean. Seeding default SOC operator and cameras...")
            
            # 1. Default Operational Clearances (Admin, Commander, Operator, Investigator)
            admin_user = User(
                id=str(uuid.uuid4()),
                username="admin",
                email="admin@borderguard.gov.in",
                hashed_password=get_password_hash("admin123"),
                full_name="Inspector V. Sharma (Lead)",
                role="admin",
                is_active=True
            )
            commander_user = User(
                id=str(uuid.uuid4()),
                username="commander",
                email="commander@borderguard.gov.in",
                hashed_password=get_password_hash("admin123"),
                full_name="Sector Commander D. Kaur",
                role="commander",
                is_active=True
            )
            operator_user = User(
                id=str(uuid.uuid4()),
                username="operator",
                email="operator@borderguard.gov.in",
                hashed_password=get_password_hash("admin123"),
                full_name="Sub-Inspector R. Verma",
                role="operator",
                is_active=True
            )
            investigator_user = User(
                id=str(uuid.uuid4()),
                username="investigator",
                email="investigator@borderguard.gov.in",
                hashed_password=get_password_hash("admin123"),
                full_name="Special Agent S. Menon",
                role="investigator",
                is_active=True
            )
            session.add_all([admin_user, commander_user, operator_user, investigator_user])

            # 2. Cameras
            cam1_id = "b1a23e54-7890-4c12-a345-6789abcdef01"
            cam2_id = "b2b34f65-8901-5d23-b456-7890bcdef012"
            cam3_id = "b3c45a76-9012-6e34-c567-8901cdef0123"
            cam4_id = "b4d56b87-0123-7f45-d678-9012def01234"

            cameras = [
                Camera(
                    id=cam1_id,
                    name="Watchtower 04 - Zero Line",
                    location="Sector 7B (Barbed Wire North)",
                    stream_url="rtsp://localhost:8554/live/border1",
                    stream_type="rtsp",
                    resolution="1920x1080",
                    fps=25,
                    status="online",
                    is_active=True
                ),
                Camera(
                    id=cam2_id,
                    name="Culvert 12 - Creek Patrol",
                    location="Sector 8A (Riverine Gap)",
                    stream_url="rtsp://localhost:8554/live/border2",
                    stream_type="rtsp",
                    resolution="1920x1080",
                    fps=25,
                    status="online",
                    is_active=True
                ),
                Camera(
                    id=cam3_id,
                    name="Post Echo - Forward Trench",
                    location="Sector 4C (Dense Foliage)",
                    stream_url="rtsp://localhost:8554/live/border3",
                    stream_type="rtsp",
                    resolution="1280x720",
                    fps=20,
                    status="online",
                    is_active=True
                ),
                Camera(
                    id=cam4_id,
                    name="Supply Gate Charlie",
                    location="Rear Base Logistics Road",
                    stream_url="rtsp://localhost:8554/live/border4",
                    stream_type="rtsp",
                    resolution="1920x1080",
                    fps=25,
                    status="online",
                    is_active=True
                )
            ]
            session.add_all(cameras)

            # 3. Restricted Zones
            zone1_id = "9f8e7d6c-5b4a-3210-fedc-ba9876543210"
            zones = [
                Zone(
                    id=zone1_id,
                    camera_id=cam1_id,
                    name="Zero-Line Barbed Wire Buffer",
                    zone_type="restricted",
                    polygon_coordinates=[[0.15, 0.40], [0.88, 0.38], [0.95, 0.88], [0.08, 0.92]],
                    severity_level="critical",
                    dwell_time_threshold=2,
                    is_active=True
                ),
                Zone(
                    id=str(uuid.uuid4()),
                    camera_id=cam1_id,
                    name="Post 4 Approach Track",
                    zone_type="buffer",
                    polygon_coordinates=[[0.02, 0.65], [0.35, 0.60], [0.45, 0.98], [0.01, 0.98]],
                    severity_level="high",
                    dwell_time_threshold=3,
                    is_active=True
                ),
                Zone(
                    id=str(uuid.uuid4()),
                    camera_id=cam2_id,
                    name="Riverine Crossing Gap Alpha",
                    zone_type="restricted",
                    polygon_coordinates=[[0.20, 0.30], [0.80, 0.30], [0.85, 0.75], [0.15, 0.75]],
                    severity_level="critical",
                    dwell_time_threshold=1,
                    is_active=True
                )
            ]
            session.add_all(zones)

            # 4. Initial Alert & Incident
            event1_id = "550e8400-e29b-41d4-a716-446655440000"
            event1 = Event(
                id=event1_id,
                camera_id=cam1_id,
                zone_id=zone1_id,
                track_id=104,
                event_type="zone_intrusion",
                target_class="person",
                confidence_score=0.89,
                bounding_box={"x_min": 510, "y_min": 340, "width": 80, "height": 185},
                start_time=datetime.now(timezone.utc) - timedelta(minutes=10)
            )
            session.add(event1)

            alert1 = Alert(
                id="6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                event_id=event1_id,
                camera_id=cam1_id,
                severity="critical",
                title="CRITICAL INTRUSION: Zero-Line Barbed Wire Buffer",
                description="Person breached restricted boundary at Sector 7B. Dwell duration: 3.2s. Tracking ID #104 actively logged.",
                status="new",
                created_at=datetime.now(timezone.utc) - timedelta(minutes=10)
            )
            session.add(alert1)

            await session.commit()
            logger.info("Database seeding completed successfully.")
