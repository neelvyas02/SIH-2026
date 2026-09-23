from typing import List, Dict, Any
from pydantic import BaseModel


class HourlyAlertCount(BaseModel):
    hour: str
    count: int


class SeverityBreakdown(BaseModel):
    critical: int
    high: int
    medium: int
    low: int


class DashboardStatsOut(BaseModel):
    active_cameras_count: int
    total_cameras_count: int
    unacknowledged_alerts: int
    critical_alerts_today: int
    resolved_today: int
    system_uptime_seconds: int
    severity_breakdown: SeverityBreakdown
    hourly_trends: List[HourlyAlertCount]
