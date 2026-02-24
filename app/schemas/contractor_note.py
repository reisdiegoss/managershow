"""
Manager Show — Schemas: ContractorNote (Notas 360 do Contratante)
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ContractorNoteBase(BaseModel):
    content: str = Field(..., min_length=1)


class ContractorNoteCreate(ContractorNoteBase):
    contractor_id: uuid.UUID


class ContractorNoteResponse(ContractorNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    contractor_id: uuid.UUID
    author_id: uuid.UUID | None
    created_at: datetime
