import logging
import re
from typing import Dict, Any, List
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings

logger = logging.getLogger("borderguard.health")

router = APIRouter(tags=["System Health & Diagnostics"])

# The 24 official IBVAP database tables
EXPECTED_TABLES: List[str] = [
    "users",
    "sectors",
    "bops",
    "zones",
    "cameras",
    "camera_zone",
    "camera_health_logs",
    "subjects",
    "detections",
    "anpr_records",
    "face_matches",
    "subject_observations",
    "journeys",
    "journey_hops",
    "alerts",
    "incidents",
    "incident_events",
    "risk_assessments",
    "risk_factors",
    "evidence",
    "investigation_queries",
    "investigation_results",
    "notifications",
    "audit_logs"
]


def sanitize_error_message(msg: str) -> str:
    """Removes passwords, secrets, connection strings, and tokens from error messages."""
    text_msg = str(msg)
    
    # Mask database connection passwords: postgresql://user:password@host:port/dbname
    pattern = r'([a-zA-Z0-9+_-]+://)([^:]+):(.+)@([^/@]+:[0-9]+|[^/@]+\.[^/@]+)'
    sanitized = re.sub(pattern, r'\1\2:***@\4', text_msg)

    # Fallback masking for any standard user:pass@ format
    sanitized = re.sub(r':([^\s@:]+)@', r':***@', sanitized)

    # Mask service role or secret key if present
    if getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", None) and settings.SUPABASE_SERVICE_ROLE_KEY.strip():
        sanitized = sanitized.replace(settings.SUPABASE_SERVICE_ROLE_KEY, "***")
    if getattr(settings, "SUPABASE_ANON_KEY", None) and settings.SUPABASE_ANON_KEY.strip():
        sanitized = sanitized.replace(settings.SUPABASE_ANON_KEY, "***")
    if getattr(settings, "SECRET_KEY", None) and settings.SECRET_KEY.strip():
        sanitized = sanitized.replace(settings.SECRET_KEY, "***")
    return sanitized


@router.get("/health")
async def health_status():
    """
    Standard service health check endpoint.
    """
    return {
        "status": "ok",
        "service": "IBVAP FastAPI Backend"
    }


@router.get("/health/db")
async def database_health_status():
    """
    Read-only Supabase PostgreSQL + PostGIS database health check.
    Executes SELECT NOW() and checks for the existence of required IBVAP tables.
    Never alters, inserts, updates, creates, or drops any tables.
    """
    db_url = (settings.DATABASE_URL or "").strip()

    # Verify that a PostgreSQL connection string is configured
    if not db_url or "sqlite" in db_url.lower():
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "database": "disconnected",
                "error": "DATABASE_URL is not configured in backend .env. Please configure your Supabase PostgreSQL connection string."
            }
        )

    # Normalize connection string for asyncpg
    normalized_url = db_url
    if normalized_url.startswith("postgresql://"):
        normalized_url = normalized_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif normalized_url.startswith("postgres://"):
        normalized_url = normalized_url.replace("postgres://", "postgresql+asyncpg://", 1)

    connect_args: Dict[str, Any] = {}
    if "supabase.co" in normalized_url or "pooler.supabase.com" in normalized_url:
        connect_args["ssl"] = "require"

    temp_engine = None
    try:
        temp_engine = create_async_engine(
            normalized_url,
            echo=False,
            future=True,
            connect_args=connect_args,
            pool_pre_ping=True
        )

        async with temp_engine.connect() as conn:
            # 1. Read-only query: SELECT NOW();
            now_res = await conn.execute(text("SELECT NOW();"))
            db_now = now_res.scalar()
            timestamp_str = db_now.isoformat() if db_now else ""

            # 2. Check PostGIS extension
            postgis_status = "not installed"
            try:
                pgis_res = await conn.execute(
                    text("SELECT extversion FROM pg_extension WHERE extname = 'postgis';")
                )
                pgis_ver = pgis_res.scalar()
                if pgis_ver:
                    postgis_status = f"available (v{pgis_ver})"
            except Exception as pe:
                logger.debug(f"PostGIS check: {pe}")

            # 3. Read-only metadata query for tables in public schema
            tables_query = text(
                """
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                  AND table_type = 'BASE TABLE';
                """
            )
            tables_res = await conn.execute(tables_query)
            existing_tables = {row[0].lower() for row in tables_res.fetchall()}

            # Match against expected tables
            found_tables = [t for t in EXPECTED_TABLES if t.lower() in existing_tables]
            missing_tables = [t for t in EXPECTED_TABLES if t.lower() not in existing_tables]

            response_data = {
                "database": "connected",
                "timestamp": timestamp_str,
                "tables_checked": len(EXPECTED_TABLES),
                "tables_found": len(found_tables),
                "missing_tables": missing_tables
            }

            if postgis_status != "not installed":
                response_data["postgis"] = postgis_status

            return response_data

    except Exception as e:
        safe_error = sanitize_error_message(str(e))
        logger.error(f"Database connection check failed: {safe_error}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "database": "disconnected",
                "error": f"Database connection failed: {safe_error}"
            }
        )
    finally:
        if temp_engine:
            await temp_engine.dispose()
