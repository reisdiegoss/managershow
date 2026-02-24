"""
Manager Show — Schemas: Contractor (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ContractorBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    document: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    city: str | None = Field(None, max_length=255)
    uf: str | None = Field(None, max_length=2)
    notes: str | None = None


class ContractorCreate(ContractorBase):
    """Schema para criação de contratante."""
    pass


class ContractorUpdate(BaseModel):
    """Schema para atualização parcial de contratante."""
    name: str | None = Field(None, min_length=2, max_length=255)
    document: str | None = None
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    uf: str | None = None
    notes: str | None = None


class ContractorResponse(ContractorBase):
    """Schema de resposta do contratante."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
