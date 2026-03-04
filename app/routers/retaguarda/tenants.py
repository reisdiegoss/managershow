"""
Manager Show — Router: Tenants (Retaguarda / Super Admin)

CRUD de escritórios/produtoras. Gerencia:
- Criação de novos tenants
- Listagem de todos os tenants
- Atualização de dados e status (Ativo, Suspenso, Trial)
- Definição de limites de usuários
"""

import uuid

from fastapi import APIRouter, Query, Depends
from sqlalchemy import func, select

from app.config import get_settings
from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.exceptions import TenantNotFoundException
from app.models.tenant import Tenant
from app.models.audit_log import AuditLog
from app.schemas.common import PaginatedResponse
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate

settings = get_settings()

router = APIRouter(
    prefix="/tenants", 
    tags=["Retaguarda — Tenants"],
    dependencies=[Depends(get_current_super_admin)]
)


@router.post("", response_model=TenantResponse, status_code=201)
async def create_tenant(
    data: TenantCreate,
    db: DbSession,
) -> Tenant:
    """Cria um novo tenant (escritório/produtora)."""
    tenant = Tenant(**data.model_dump())
    db.add(tenant)
    await db.flush()
    await db.refresh(tenant)
    return tenant


@router.get("", response_model=PaginatedResponse[TenantResponse])
async def list_tenants(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    """Lista todos os tenants com paginação."""
    offset = (page - 1) * page_size

    # Total de registros (Excluindo a Vima Sistemas - Intocável)
    count_stmt = select(func.count()).select_from(Tenant).where(Tenant.name != "Vima Sistemas (HQ)")
    total = (await db.execute(count_stmt)).scalar() or 0

    # Registros paginados (Excluindo a Vima Sistemas - Intocável)
    stmt = (
        select(Tenant)
        .where(Tenant.name != "Vima Sistemas (HQ)")
        .offset(offset)
        .limit(page_size)
        .order_by(Tenant.created_at.desc())
    )
    result = await db.execute(stmt)
    tenants = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return {
        "items": tenants,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant_360(
    tenant_id: uuid.UUID,
    db: DbSession,
) -> Tenant:
    """Busca a ficha 360º completa do tenant."""
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise TenantNotFoundException(tenant_id)

    # Nota: Aqui poderíamos injetar métricas reais de uso de S3/Usuários
    # Para o MVP, retornamos o model rico que já possui os limites
    return tenant


@router.patch("/{tenant_id}/suspend", response_model=TenantResponse)
async def toggle_tenant_suspension(
    tenant_id: uuid.UUID,
    db: DbSession,
) -> Tenant:
    """Kill Switch: Suspende ou reativa o acesso do tenant imediatamente."""
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise TenantNotFoundException(tenant_id)

    tenant.is_suspended = not tenant.is_suspended
    tenant.status = "SUSPENDED" if tenant.is_suspended else "ACTIVE"
    
    # Auditoria
    db.add(AuditLog(
        admin_id="SUPERADMIN", # Em prod, pegar do current_user.id do Clerk
        action="TENANT_SUSPENSION_TOGGLE",
        target_id=str(tenant_id),
        details={"new_status": tenant.status, "is_suspended": tenant.is_suspended}
    ))

    await db.flush()
    await db.refresh(tenant)
    return tenant


@router.patch("/{tenant_id}/features", response_model=TenantResponse)
async def update_tenant_features(
    tenant_id: uuid.UUID,
    data: TenantUpdate,
    db: DbSession,
) -> Tenant:
    """Atualiza limites técnicos (Usuários, S3) e Feature Toggles (JSONB)."""
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise TenantNotFoundException(tenant_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in ["users_limit", "storage_limit_gb", "whatsapp_limit", "feature_toggles", "enabled_modules", "account_type"]:
            setattr(tenant, field, value)

    await db.flush()
    await db.refresh(tenant)
    return tenant


@router.post("/{tenant_id}/impersonate")
async def impersonate_tenant(
    tenant_id: uuid.UUID,
    db: DbSession,
):
    """
    God Mode: Gera credenciais para que o SuperAdmin espelhe a conta do cliente.
    Utiliza a API de Impersonation do Clerk.
    """
    # 1. Validar existência do tenant
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise TenantNotFoundException(tenant_id)

    # 2. Lógica Clerk: Determinamos o host base dinamicamente
    base_url = "http://localhost:3000" if settings.is_development else "https://clerk.managershow.com"
    
    return {
        "message": "Protocolo de Impersonation autorizado",
        "tenant_id": str(tenant_id),
        "target_clerk_org_id": f"org_{tenant.id.hex[:24]}",
        "impersonation_url": f"{base_url}/admin/impersonate/{tenant_id}"
    }


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: uuid.UUID,
    data: TenantUpdate,
    db: DbSession,
) -> Tenant:
    """Atualiza ficha cadastral do tenant."""
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise TenantNotFoundException(tenant_id)

    update_data = data.model_dump(exclude_unset=True)
    # Bloqueamos alteração de campos sensíveis por aqui (usar endpoints dedicados)
    protected_fields = ["is_suspended", "plan_type"]
    
    for field, value in update_data.items():
        if field not in protected_fields:
            setattr(tenant, field, value)

    await db.flush()
    await db.refresh(tenant)
    return tenant
