"""
Manager Show — Schemas: Tenant (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.tenant import TenantStatus


class TenantCreate(BaseModel):
    """Schema de criação de tenant (Retaguarda)."""
    name: str = Field(..., min_length=2, max_length=255, description="Nome do escritório/agência")
    document: str | None = Field(None, max_length=20, description="CNPJ ou CPF")
    email: str | None = Field(None, max_length=255, description="E-mail principal")
    phone: str | None = Field(None, max_length=20, description="Telefone de contato")
    max_users: int = Field(5, ge=1, le=100, description="Limite de usuários")
    status: TenantStatus = TenantStatus.TRIAL


class TenantUpdate(BaseModel):
    """Schema de atualização parcial de tenant."""
    name: str | None = Field(None, min_length=2, max_length=255)
    document: str | None = None
    email: str | None = None
    phone: str | None = None
    max_users: int | None = Field(None, ge=1, le=100)
    status: TenantStatus | None = None
    subscription_expires_at: datetime | None = None


class TenantResponse(BaseModel):
    """Schema de resposta do tenant."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    document: str | None
    email: str | None
    phone: str | None
    status: TenantStatus
    max_users: int
    subscription_expires_at: datetime | None
    created_at: datetime
    updated_at: datetime
