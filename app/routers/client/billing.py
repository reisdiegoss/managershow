"""
Manager Show — Router: Billing (Client)
Permite que o próprio Tenant veja o catálogo e gerencie seus limites (Lojinha).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from app.core.dependencies import DbSession, CurrentUser, TenantId
from app.models.saas_catalog import SaaS_Bundle, SaaS_Addon, AddonType, Tenant_Subscription_Log
from app.models.tenant import Tenant
from app.services.storage_service import StorageService
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/billing", tags=["Client — Billing & Store"])

class PurchaseRequest(BaseModel):
    id: uuid.UUID

@router.get("/catalog")
async def get_catalog(db: DbSession):
    """Retorna o catálogo completo de Bundles e Addons disponíveis."""
    bundles = await db.scalars(select(SaaS_Bundle))
    addons = await db.scalars(select(SaaS_Addon))
    
    return {
        "bundles": [
            {
                "id": b.id,
                "name": b.name,
                "description": b.description,
                "price": b.price,
                "users": b.add_users,
                "storage_gb": b.add_storage_gb,
                "whatsapp": b.add_whatsapp
            }
            for b in bundles.all()
        ],
        "addons": [
            {
                "id": a.id,
                "name": a.name,
                "type": a.addon_type,
                "price": a.price,
                "quantity": a.quantity_added
            }
            for a in addons.all()
        ]
    }

@router.post("/buy-bundle")
async def client_buy_bundle(
    req: PurchaseRequest,
    db: DbSession,
    tenant_id: TenantId,
    current_user: CurrentUser
):
    """O próprio tenant compra um combo/bundle."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    bundle = await db.scalar(select(SaaS_Bundle).where(SaaS_Bundle.id == req.id))
    
    if not bundle:
        raise HTTPException(status_code=404, detail="Combo não encontrado.")

    # Atualiza limites (Sobrescreve o base)
    tenant.users_limit = bundle.add_users
    tenant.storage_limit_gb = bundle.add_storage_gb
    tenant.whatsapp_limit = bundle.add_whatsapp
    
    await StorageService.provision_tenant_bucket(tenant.id, tenant.storage_limit_gb)

    log = Tenant_Subscription_Log(
        tenant_id=tenant.id,
        bundle_id=bundle.id,
        amount_paid=bundle.price
    )
    db.add(log)
    
    await db.flush()
    await db.refresh(tenant)
    return {"message": f"Plano {bundle.name} ativado com sucesso.", "limits": {
        "users": tenant.users_limit,
        "storage": tenant.storage_limit_gb,
        "whatsapp": tenant.whatsapp_limit
    }}

@router.post("/buy-addon")
async def client_buy_addon(
    req: PurchaseRequest,
    db: DbSession,
    tenant_id: TenantId,
    current_user: CurrentUser
):
    """O próprio tenant compra um addon individual (Soma ao existente)."""
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    addon = await db.scalar(select(SaaS_Addon).where(SaaS_Addon.id == req.id))
    
    if not addon:
        raise HTTPException(status_code=404, detail="Addon não encontrado.")

    if addon.addon_type == AddonType.STORAGE:
        tenant.storage_limit_gb += addon.quantity_added
        await StorageService.provision_tenant_bucket(tenant.id, tenant.storage_limit_gb)
    elif addon.addon_type == AddonType.USERS:
        tenant.users_limit += addon.quantity_added
    elif addon.addon_type == AddonType.WHATSAPP:
        tenant.whatsapp_limit += addon.quantity_added

    log = Tenant_Subscription_Log(
        tenant_id=tenant.id,
        addon_id=addon.id,
        amount_paid=addon.price
    )
    db.add(log)
    
    await db.flush()
    await db.refresh(tenant)
    return {"message": f"Recurso {addon.name} adicionado.", "limits": {
        "users": tenant.users_limit,
        "storage": tenant.storage_limit_gb,
        "whatsapp": tenant.whatsapp_limit
    }}
