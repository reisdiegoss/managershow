"""
Manager Show — Schemas: SaaS Catalog Models
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.saas_catalog import AddonType


class SaaSCatalogBundleCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    price: float = Field(..., ge=0)
    add_users: int = Field(0, ge=0)
    add_storage_gb: int = Field(0, ge=0)
    add_whatsapp: int = Field(0, ge=0)

class SaaSCatalogBundleUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    price: float | None = Field(None, ge=0)
    add_users: int | None = Field(None, ge=0)
    add_storage_gb: int | None = Field(None, ge=0)
    add_whatsapp: int | None = Field(None, ge=0)

class SaaSCatalogBundleResponse(BaseModel):
    id: UUID
    name: str
    price: float
    add_users: int
    add_storage_gb: int
    add_whatsapp: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SaaSCatalogAddonCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    price: float = Field(..., ge=0)
    addon_type: AddonType
    quantity_added: int = Field(..., ge=1)

class SaaSCatalogAddonUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    price: float | None = Field(None, ge=0)
    addon_type: AddonType | None = None
    quantity_added: int | None = Field(None, ge=1)

class SaaSCatalogAddonResponse(BaseModel):
    id: UUID
    name: str
    price: float
    addon_type: AddonType
    quantity_added: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantSubscriptionLogResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    bundle_id: UUID | None
    addon_id: UUID | None
    amount_paid: float
    logged_at: datetime

    model_config = ConfigDict(from_attributes=True)
