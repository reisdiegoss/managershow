"""
Manager Show — Schemas: Artist (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ArtistBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    legal_name: str | None = Field(None, max_length=255)
    document: str | None = Field(None, max_length=20)
    genre: str | None = Field(None, max_length=100)
    bio: str | None = None
    photo_url: str | None = Field(None, max_length=500)


class ArtistCreate(ArtistBase):
    """Schema para criação de artista."""
    pass


class ArtistUpdate(BaseModel):
    """Schema para atualização parcial de artista."""
    name: str | None = Field(None, min_length=2, max_length=255)
    legal_name: str | None = None
    document: str | None = None
    genre: str | None = None
    bio: str | None = None
    photo_url: str | None = None


class ArtistResponse(ArtistBase):
    """Schema de resposta do artista."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
