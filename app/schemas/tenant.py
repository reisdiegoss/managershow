"""
Manager Show — Schemas: Tenant (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.tenant import TenantStatus


class TenantCreate(BaseModel):
    """Schema de criação de tenant (Retaguarda)."""
    name: str = Field(..., min_length=2, max_length=255)
    cnpj: str = Field(..., min_length=14, max_length=20, description="CNPJ obrigatório na criação")
    document: str | None = Field(None, max_length=20)
    email: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=20)
    address: str | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    account_type: str = Field("ARTIST", max_length=50)
    users_limit: int = Field(1, ge=1, le=1000)
    storage_limit_gb: int = Field(5, ge=1, le=10000)
    whatsapp_limit: int = Field(0, ge=0, le=100)
    # Endereço Fragmentado
    cep: str | None = None
    street: str | None = None
    number: str | None = None
    complement: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    
    plan_type: str = "Essencial"
    plan_id: UUID | None = None
    enabled_modules: list[str] = Field(default_factory=list)
    feature_toggles: dict = Field(default_factory=dict)
    is_onboarded: bool = False
    status: TenantStatus = TenantStatus.TRIAL


class TenantUpdate(BaseModel):
    """Schema de atualização parcial de tenant."""
    name: str | None = Field(None, min_length=2, max_length=255)
    cnpj: str | None = None
    document: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    contact_name: str | None = None
    contact_phone: str | None = None
    account_type: str | None = Field(None, max_length=50)
    users_limit: int | None = Field(None, ge=1, le=1000)
    storage_limit_gb: int | None = Field(None, ge=1, le=10000)
    whatsapp_limit: int | None = Field(None, ge=0, le=100)
    # Endereço Fragmentado
    cep: str | None = None
    street: str | None = None
    number: str | None = None
    complement: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    plan_type: str | None = None
    plan_id: UUID | None = None
    enabled_modules: list[str] | None = None
    feature_toggles: dict | None = None
    is_onboarded: bool | None = None
    status: TenantStatus | None = None
    is_suspended: bool | None = None
    subscription_expires_at: datetime | None = None


class TenantResponse(BaseModel):
    """Schema de resposta do tenant."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    cnpj: str | None
    document: str | None
    email: str | None
    phone: str | None
    address: str | None
    contact_name: str | None
    contact_phone: str | None
    is_onboarded: bool
    status: TenantStatus
    account_type: str
    plan_type: str
    plan_id: UUID | None
    enabled_modules: list[str]
    feature_toggles: dict
    users_limit: int
    storage_limit_gb: int
    whatsapp_limit: int
    # Endereço Fragmentado
    cep: str | None
    street: str | None
    number: str | None
    complement: str | None
    neighborhood: str | None
    city: str | None
    state: str | None
    is_suspended: bool
    subscription_expires_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TenantSettingsResponse(BaseModel):
    primary_color: str | None = None
    logo_url: str | None = None
    require_visual_lock: bool = True
    default_agency_fee: float = 0.0
    negotiation_setup: dict | None = None
    model_config = ConfigDict(from_attributes=True)

class TenantOnboardingUpdate(BaseModel):
    primary_color: str | None = None
    negotiation_setup: dict | None = None
