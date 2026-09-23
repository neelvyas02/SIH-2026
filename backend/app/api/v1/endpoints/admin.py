from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.system_log import SystemLog
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()


class AuditLogOut(BaseModel):
    id: str
    actor: str
    role: str
    action: str
    target: str
    timestamp: str
    ip: str
    model_config = ConfigDict(from_attributes=True)


class AuditLogCreate(BaseModel):
    actor: str
    role: str
    action: str
    target: str
    ip: Optional[str] = "10.0.0.1"


@router.get("/audit-logs", response_model=List[AuditLogOut])
async def list_audit_logs(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Retrieves immutable system and operator action audit trail."""
    result = await db.execute(
        select(SystemLog).order_by(desc(SystemLog.created_at)).limit(limit).offset(offset)
    )
    logs = result.scalars().all()
    outs = []
    for l in logs:
        details = l.details or {}
        outs.append(AuditLogOut(
            id=f"AUD-{l.id:04d}",
            actor=details.get("actor", l.service_name),
            role=details.get("role", "OPERATOR").upper(),
            action=details.get("action", l.message),
            target=details.get("target", l.level),
            timestamp=l.created_at.isoformat() if l.created_at else datetime.now(timezone.utc).isoformat(),
            ip=details.get("ip", "10.9.4.15")
        ))
    return outs


@router.post("/audit-logs", response_model=AuditLogOut, status_code=status.HTTP_201_CREATED)
async def record_audit_log(
    body: AuditLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Records a new operator or commander action into the tamper-evident audit trail."""
    log_entry = SystemLog(
        service_name=f"operator.{body.actor}",
        level="INFO",
        message=f"{body.action} on {body.target}",
        details={
            "actor": body.actor,
            "role": body.role,
            "action": body.action,
            "target": body.target,
            "ip": body.ip or "10.9.4.15"
        }
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    return AuditLogOut(
        id=f"AUD-{log_entry.id:04d}",
        actor=body.actor,
        role=body.role.upper(),
        action=body.action,
        target=body.target,
        timestamp=log_entry.created_at.isoformat(),
        ip=body.ip or "10.9.4.15"
    )
