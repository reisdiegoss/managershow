"""
Manager Show — Schemas: Venue (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class VenueBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    city: str = Field(..., max_length=255)
    uf: str = Field(..., max_length=2)
    address: str | None = Field(None, max_length=500)
    capacity: int | None = Field(None, ge=0)
    contact_name: str | None = Field(None, max_length=255)
    contact_phone: str | None = Field(None, max_length=20)
    notes: str | None = None


class VenueCreate(VenueBase):
    """Schema para criação de local."""
    pass


class VenueUpdate(BaseModel):
    """Schema para atualização parcial de local."""
    name: str | None = Field(None, min_length=2, max_length=255)
    city: str | None = None
    uf: str | None = None
    address: str | None = None
    capacity: int | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    notes: str | None = None


class VenueResponse(VenueBase):
    """Schema de resposta do local."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
