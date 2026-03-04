"""
Manager Show — Schemas: SaaS Lead / CRM (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.saas_lead import SaaSLeadStatus


class SaaSLeadCreate(BaseModel):
    """Schema de criação de lead do SaaS."""
    company_name: str = Field(..., min_length=2, max_length=255)
    contact_name: str = Field(..., min_length=2, max_length=255)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    document: str | None = Field(None, max_length=20)
    source: str | None = Field(None, max_length=100)
    notes: str | None = None


class SaaSLeadUpdate(BaseModel):
    """Schema de atualização parcial."""
    company_name: str | None = Field(None, min_length=2, max_length=255)
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    document: str | None = None
    status: SaaSLeadStatus | None = None
    source: str | None = None
    notes: str | None = None


class SaaSLeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    company_name: str
    contact_name: str
    email: str | None
    phone: str | None
    document: str | None
    status: SaaSLeadStatus
    source: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime
