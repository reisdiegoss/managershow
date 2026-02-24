"""
Manager Show — Schemas: Seller (Vendedor)
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class SellerBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    user_id: uuid.UUID | None = None


class SellerCreate(SellerBase):
    pass


class SellerUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    email: str | None = None
    phone: str | None = None
    user_id: uuid.UUID | None = None


class SellerResponse(SellerBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
