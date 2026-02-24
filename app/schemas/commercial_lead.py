"""
Manager Show — Schemas: CommercialLead (CRM do Tenant)
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

from app.models.commercial_lead import CommercialLeadStatus


class CommercialLeadBase(BaseModel):
    contractor_name: str = Field(..., min_length=2, max_length=255)
    contractor_id: uuid.UUID | None = None
    city: str = Field(..., min_length=2, max_length=255)
    target_date: str | None = Field(None, max_length=50)
    estimated_budget: float | None = Field(None, ge=0)
    notes: str | None = None
    seller_id: uuid.UUID | None = None


class CommercialLeadCreate(CommercialLeadBase):
    pass


class CommercialLeadUpdate(BaseModel):
    contractor_name: str | None = Field(None, min_length=2, max_length=255)
    contractor_id: uuid.UUID | None = None
    city: str | None = Field(None, min_length=2, max_length=255)
    target_date: str | None = None
    estimated_budget: float | None = None
    status: CommercialLeadStatus | None = None
    notes: str | None = None
    seller_id: uuid.UUID | None = None


class CommercialLeadResponse(CommercialLeadBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    status: CommercialLeadStatus
    created_at: datetime
    updated_at: datetime
