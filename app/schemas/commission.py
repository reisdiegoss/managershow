"""
Manager Show — Schemas: Commission (Pydantic V2)
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.commission import CommissionBase


class CommissionCreate(BaseModel):
    """Schema de criação de comissão."""
    beneficiary_name: str = Field(..., min_length=2, max_length=255)
    user_id: UUID | None = None
    commission_base: CommissionBase
    percentage: Decimal = Field(..., ge=0, le=100, decimal_places=2)


class CommissionUpdate(BaseModel):
    """Schema de atualização parcial de comissão."""
    beneficiary_name: str | None = None
    commission_base: CommissionBase | None = None
    percentage: Decimal | None = Field(None, ge=0, le=100, decimal_places=2)


class CommissionResponse(BaseModel):
    """Schema de resposta da comissão."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    show_id: UUID
    beneficiary_name: str
    user_id: UUID | None
    commission_base: CommissionBase
    percentage: Decimal
    created_at: datetime
    updated_at: datetime
