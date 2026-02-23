"""
Manager Show — Schemas: User (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    """Schema de criação de usuário."""
    clerk_id: str = Field(..., description="ID do Clerk")
    email: str = Field(..., max_length=255)
    name: str = Field(..., min_length=2, max_length=255)
    role_id: UUID | None = None
    is_active: bool = True


class UserUpdate(BaseModel):
    """Schema de atualização parcial de usuário."""
    email: str | None = Field(None, max_length=255)
    name: str | None = Field(None, min_length=2, max_length=255)
    role_id: UUID | None = None
    is_active: bool | None = None


class UserResponse(BaseModel):
    """Schema de resposta do usuário."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    clerk_id: str
    email: str
    name: str
    role_id: UUID | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class UserMeResponse(UserResponse):
    """Schema de resposta do /me com dados do role inline."""
    role_name: str | None = None
    permissions: dict | None = None
