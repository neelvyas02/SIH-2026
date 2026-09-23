from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.camera import Camera
from app.models.alert import Alert
from app.schemas.stats import DashboardStatsOut, SeverityBreakdown, HourlyAlertCount

router = APIRouter()


@router.get("/summary", response_model=DashboardStatsOut)
async def get_dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Provides aggregated metrics, severity breakdown, and hourly trends for the SOC overview."""
    # 1. Camera counts
    cam_res = await db.execute(select(func.count(Camera.id)))
    total_cameras = cam_res.scalar() or 0

    active_cam_res = await db.execute(select(func.count(Camera.id)).where(Camera.status == "online", Camera.is_active == True))
    active_cameras = active_cam_res.scalar() or 0

    # 2. Unacknowledged alerts
    unack_res = await db.execute(select(func.count(Alert.id)).where(Alert.status == "new"))
    unack_alerts = unack_res.scalar() or 0

    # 3. Critical alerts today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    crit_res = await db.execute(select(func.count(Alert.id)).where(Alert.severity == "critical", Alert.created_at >= today_start))
    critical_today = crit_res.scalar() or 0

    # 4. Resolved today
    res_today_res = await db.execute(select(func.count(Alert.id)).where(Alert.status == "resolved", Alert.resolved_at >= today_start))
    resolved_today = res_today_res.scalar() or 0

    # 5. Severity breakdown
    crit_total = (await db.execute(select(func.count(Alert.id)).where(Alert.severity == "critical"))).scalar() or 0
    high_total = (await db.execute(select(func.count(Alert.id)).where(Alert.severity == "high"))).scalar() or 0
    med_total = (await db.execute(select(func.count(Alert.id)).where(Alert.severity == "medium"))).scalar() or 0
    low_total = (await db.execute(select(func.count(Alert.id)).where(Alert.severity == "low"))).scalar() or 0

    # 6. Hourly alert trends (past 6 hours)
    now = datetime.now(timezone.utc)
    hourly_trends = []
    for i in range(5, -1, -1):
        h_start = now - timedelta(hours=i+1)
        h_end = now - timedelta(hours=i)
        h_count_res = await db.execute(
            select(func.count(Alert.id)).where(Alert.created_at >= h_start, Alert.created_at < h_end)
        )
        count = h_count_res.scalar() or 0
        hourly_trends.append(HourlyAlertCount(
            hour=h_end.strftime("%H:00"),
            count=count
        ))

    return DashboardStatsOut(
        active_cameras_count=active_cameras,
        total_cameras_count=total_cameras,
        unacknowledged_alerts=unack_alerts,
        critical_alerts_today=critical_today,
        resolved_today=resolved_today,
        system_uptime_seconds=86400,
        severity_breakdown=SeverityBreakdown(
            critical=crit_total,
            high=high_total,
            medium=med_total,
            low=low_total
        ),
        hourly_trends=hourly_trends
    )
