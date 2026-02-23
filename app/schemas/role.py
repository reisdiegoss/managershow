"""
Manager Show — Schemas: Role (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class RoleCreate(BaseModel):
    """Schema de criação de perfil de permissão."""
    name: str = Field(..., min_length=2, max_length=100, description="Nome do perfil")
    description: str | None = Field(None, max_length=500)
    permissions: dict = Field(
        default_factory=dict,
        description="Matriz JSONB de permissões granulares",
    )


class RoleUpdate(BaseModel):
    """Schema de atualização parcial de perfil."""
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None
    permissions: dict | None = None


class RoleResponse(BaseModel):
    """Schema de resposta do perfil de permissão."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    name: str
    description: str | None
    permissions: dict
    created_at: datetime
    updated_at: datetime
