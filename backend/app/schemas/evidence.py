from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EvidenceOut(BaseModel):
    id: str
    event_id: str
    file_path: str
    file_type: str
    file_size_bytes: int
    sha256_hash: str
    created_at: datetime
    url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
