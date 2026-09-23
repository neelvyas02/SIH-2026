from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.evidence import Evidence
from app.schemas.evidence import EvidenceOut

router = APIRouter()


@router.get("", response_model=List[EvidenceOut])
async def list_evidence(
    event_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves stored forensic snapshots and video snippets."""
    query = select(Evidence).order_by(desc(Evidence.created_at)).limit(limit).offset(offset)
    if event_id:
        query = query.where(Evidence.event_id == event_id)

    result = await db.execute(query)
    items = result.scalars().all()
    outs = []
    for item in items:
        out = EvidenceOut.model_validate(item)
        out.url = f"/static/evidence/{item.file_path}"
        outs.append(out)
    return outs


@router.get("/{evidence_id}", response_model=EvidenceOut)
async def get_evidence(evidence_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieves cryptographic hash and verification data for a specific evidence item."""
    result = await db.execute(select(Evidence).where(Evidence.id == evidence_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Evidence item not found")
    out = EvidenceOut.model_validate(item)
    out.url = f"/static/evidence/{item.file_path}"
    return out
