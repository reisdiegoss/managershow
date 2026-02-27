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

from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.exceptions import TenantNotFoundException
from app.models.tenant import Tenant
from app.schemas.common import PaginatedResponse
from app.schemas.tenant import TenantCreate, TenantResponse, TenantUpdate

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

    # Total de registros
    count_stmt = select(func.count()).select_from(Tenant)
    total = (await db.execute(count_stmt)).scalar() or 0

    # Registros paginados com join no plano
    stmt = (
        select(Tenant)
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
async def get_tenant(
    tenant_id: uuid.UUID,
    db: DbSession,
) -> Tenant:
    """Busca um tenant pelo ID."""
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise TenantNotFoundException(tenant_id)

    return tenant


@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: uuid.UUID,
    data: TenantUpdate,
    db: DbSession,
) -> Tenant:
    """Atualiza parcialmente um tenant."""
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise TenantNotFoundException(tenant_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)

    await db.flush()
    await db.refresh(tenant)
    return tenant
