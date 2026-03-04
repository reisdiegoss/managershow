"""
Manager Show — Rotas: Billing SaaS Modular
"""

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.models.tenant import Tenant
from app.models.saas_catalog import SaaS_Bundle, SaaS_Addon, Tenant_Subscription_Log, AddonType
from app.services.storage_service import StorageService

router = APIRouter(
    prefix="/billing",
    tags=["Retaguarda — Billing SaaS"],
    dependencies=[Depends(get_current_super_admin)] # Ou get_current_user dependendo de quem acessa
)

@router.post("/tenants/{tenant_id}/buy-bundle")
async def buy_bundle(
    tenant_id: UUID, 
    bundle_id: UUID,
    db: DbSession
):
    """
    Aplica um "Atalho/Plano" inteiro para um Tenant (SaaS_Bundle).
    Isso sobrescreve os limites base do Tenant.
    """
    # 1. Obter Tenant
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")

    # 2. Obter Bundle
    bundle = await db.scalar(select(SaaS_Bundle).where(SaaS_Bundle.id == bundle_id))
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle não encontrado")

    # 3. Atualizar Limites do Tenant
    tenant.users_limit = bundle.add_users
    tenant.storage_limit_gb = bundle.add_storage_gb
    tenant.whatsapp_limit = bundle.add_whatsapp
    
    # 4. Provisionar/Ajustar Minio Bucket
    await StorageService.provision_tenant_bucket(tenant.id, tenant.storage_limit_gb)

    # 5. Registrar log inalterável de auditoria
    log = Tenant_Subscription_Log(
        tenant_id=tenant.id,
        bundle_id=bundle.id,
        amount_paid=bundle.price
    )
    db.add(log)

    await db.flush()
    await db.refresh(tenant)

    return {"message": f"Bundle '{bundle.name}' ativado com sucesso.", "tenant_limits": {
        "users": tenant.users_limit,
        "storage_gb": tenant.storage_limit_gb,
        "whatsapp": tenant.whatsapp_limit
    }}


@router.post("/tenants/{tenant_id}/buy-addon")
async def buy_addon(
    tenant_id: UUID, 
    addon_id: UUID,
    db: DbSession
):
    """
    Processa a 'Lojinha': Soma um Addon aos recursos já existentes do Tenant.
    """
    # 1. Obter Tenant e Addon
    tenant = await db.scalar(select(Tenant).where(Tenant.id == tenant_id))
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")

    addon = await db.scalar(select(SaaS_Addon).where(SaaS_Addon.id == addon_id))
    if not addon:
        raise HTTPException(status_code=404, detail="Addon não encontrado")

    # 2. Somar recursos
    if addon.addon_type == AddonType.STORAGE:
        tenant.storage_limit_gb += addon.quantity_added
        # Provisionar o aumento direto no servidor Minio (Quota Adjustment)
        await StorageService.provision_tenant_bucket(tenant.id, tenant.storage_limit_gb)
        
    elif addon.addon_type == AddonType.USERS:
        tenant.users_limit += addon.quantity_added
        
    elif addon.addon_type == AddonType.WHATSAPP:
        tenant.whatsapp_limit += addon.quantity_added

    # 3. Auditar/Log
    log = Tenant_Subscription_Log(
        tenant_id=tenant.id,
        addon_id=addon.id,
        amount_paid=addon.price
    )
    db.add(log)

    await db.flush()
    await db.refresh(tenant)

    return {
        "message": f"Addon '{addon.name}' ({addon.quantity_added}x) comprado com sucesso.",
        "tenant_limits": {
            "users": tenant.users_limit,
            "storage_gb": tenant.storage_limit_gb,
            "whatsapp": tenant.whatsapp_limit
        }
    }
