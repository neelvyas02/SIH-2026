from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api import api_router
from app.api.health import router as health_router
from app.api.websockets.alert_stream import ws_manager
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("borderguard.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management: initializes local database if using sqlite."""
    logger.info(f"Starting {settings.PROJECT_NAME} in {settings.ENVIRONMENT} mode...")
    try:
        # Protect remote/Supabase PostgreSQL databases: never auto-drop or auto-create remote tables
        if "sqlite" in (settings.DATABASE_URL or "").lower():
            await init_db()
            logger.info("Local SQLite database schema initialized successfully.")
        else:
            logger.info("Remote PostgreSQL database detected. Skipping local schema creation and seed routines.")
    except Exception as e:
        logger.error(f"Database startup check: {e}")
    yield
    logger.info(f"Shutting down {settings.PROJECT_NAME}...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Storage for Evidence Snapshots & Clips
app.mount("/static/evidence", StaticFiles(directory=settings.STORAGE_DIR), name="evidence")

# Include Health & Diagnostics Router (/api/health, /api/health/db)
app.include_router(health_router, prefix="/api")

# Include REST API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "title": settings.PROJECT_NAME,
        "status": "operational",
        "docs_url": f"{settings.API_V1_STR}/docs",
        "soc_mode": "Defense Perimeter Surveillance"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "backend"}


@app.websocket(f"{settings.API_V1_STR}/ws/alerts")
async def websocket_alert_endpoint(websocket: WebSocket, token: str = Query(None)):
    """Real-time WebSocket endpoint for SOC dashboard live alerts."""
    await ws_manager.connect(websocket)
    try:
        # Welcome message
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to BorderGuard AI Real-Time Alert Gateway"
        })
        while True:
            # Keep connection open and receive heartbeats / pings from frontend
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)
