from fastapi import APIRouter
from app.api.v1.endpoints import auth, cameras, zones, alerts, events, stats, internal, detection, evidence, admin

api_router = APIRouter()

api_router.include_router(detection.router, prefix="/detect", tags=["Live Object Detection"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["Cameras"])
api_router.include_router(zones.router, tags=["Restricted Zones"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(stats.router, prefix="/stats", tags=["Dashboard Statistics"])
api_router.include_router(evidence.router, prefix="/evidence", tags=["Forensic Evidence"])
api_router.include_router(admin.router, prefix="/admin", tags=["System Administration"])
api_router.include_router(internal.router, prefix="/internal", tags=["Internal AI Webhooks"])

