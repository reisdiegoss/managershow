"""
Manager Show — Router: Plans (Retaguarda / Super Admin)

Gestão dos planos e pacotes do SaaS.
"""

import uuid
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy import func, select
from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.models.saas_catalog import SaaS_Bundle, SaaS_Addon
from app.schemas.common import PaginatedResponse
from app.schemas.saas_catalog import (
    SaaSCatalogBundleCreate, 
    SaaSCatalogBundleResponse, 
    SaaSCatalogBundleUpdate,
    SaaSCatalogAddonCreate,
    SaaSCatalogAddonResponse,
    SaaSCatalogAddonUpdate
)

router = APIRouter(
    prefix="/plans", 
    tags=["Retaguarda — Planos & Módulos"],
    dependencies=[Depends(get_current_super_admin)]
)

# =============================================================================
# Bundles (Planos Base)
# =============================================================================

@router.post("/bundles", response_model=SaaSCatalogBundleResponse, status_code=201)
async def create_bundle(
    data: SaaSCatalogBundleCreate,
    db: DbSession,
) -> SaaS_Bundle:
    """Cria um novo plano base (Bundle)."""
    bundle = SaaS_Bundle(**data.model_dump())
    db.add(bundle)
    await db.flush()
    await db.refresh(bundle)
    return bundle

@router.get("/bundles", response_model=PaginatedResponse[SaaSCatalogBundleResponse])
async def list_bundles(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    """Lista todos os bundles com paginação."""
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(SaaS_Bundle)
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = select(SaaS_Bundle).offset(offset).limit(page_size).order_by(SaaS_Bundle.created_at.desc())
    result = await db.execute(stmt)
    bundles = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return {
        "items": bundles,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

@router.get("/bundles/{bundle_id}", response_model=SaaSCatalogBundleResponse)
async def get_bundle(
    bundle_id: uuid.UUID,
    db: DbSession,
) -> SaaS_Bundle:
    stmt = select(SaaS_Bundle).where(SaaS_Bundle.id == bundle_id)
    result = await db.execute(stmt)
    bundle = result.scalar_one_or_none()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle não encontrado")
    return bundle

@router.patch("/bundles/{bundle_id}", response_model=SaaSCatalogBundleResponse)
async def update_bundle(
    bundle_id: uuid.UUID,
    data: SaaSCatalogBundleUpdate,
    db: DbSession,
) -> SaaS_Bundle:
    stmt = select(SaaS_Bundle).where(SaaS_Bundle.id == bundle_id)
    result = await db.execute(stmt)
    bundle = result.scalar_one_or_none()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle não encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bundle, field, value)

    await db.flush()
    await db.refresh(bundle)
    return bundle

@router.delete("/bundles/{bundle_id}", status_code=204)
async def delete_bundle(
    bundle_id: uuid.UUID,
    db: DbSession,
):
    stmt = select(SaaS_Bundle).where(SaaS_Bundle.id == bundle_id)
    result = await db.execute(stmt)
    bundle = result.scalar_one_or_none()
    if not bundle:
        raise HTTPException(status_code=404, detail="Bundle não encontrado")
    
    await db.delete(bundle)
    await db.commit()
    return None

# =============================================================================
# Addons (Módulos Avulsos)
# =============================================================================

@router.post("/addons", response_model=SaaSCatalogAddonResponse, status_code=201)
async def create_addon(
    data: SaaSCatalogAddonCreate,
    db: DbSession,
) -> SaaS_Addon:
    addon = SaaS_Addon(**data.model_dump())
    db.add(addon)
    await db.flush()
    await db.refresh(addon)
    return addon

@router.get("/addons", response_model=PaginatedResponse[SaaSCatalogAddonResponse])
async def list_addons(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    offset = (page - 1) * page_size
    count_stmt = select(func.count()).select_from(SaaS_Addon)
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = select(SaaS_Addon).offset(offset).limit(page_size).order_by(SaaS_Addon.created_at.desc())
    result = await db.execute(stmt)
    addons = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return {
        "items": addons,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

@router.patch("/addons/{addon_id}", response_model=SaaSCatalogAddonResponse)
async def update_addon(
    addon_id: uuid.UUID,
    data: SaaSCatalogAddonUpdate,
    db: DbSession,
) -> SaaS_Addon:
    stmt = select(SaaS_Addon).where(SaaS_Addon.id == addon_id)
    result = await db.execute(stmt)
    addon = result.scalar_one_or_none()
    if not addon:
        raise HTTPException(status_code=404, detail="Addon não encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(addon, field, value)

    await db.flush()
    await db.refresh(addon)
    return addon

@router.delete("/addons/{addon_id}", status_code=204)
async def delete_addon(
    addon_id: uuid.UUID,
    db: DbSession,
):
    stmt = select(SaaS_Addon).where(SaaS_Addon.id == addon_id)
    result = await db.execute(stmt)
    addon = result.scalar_one_or_none()
    if not addon:
        raise HTTPException(status_code=404, detail="Addon não encontrado")
    
    await db.delete(addon)
    await db.commit()
    return None

# Manter compatibilidate com o grid antigo por enquanto, ou mapear /plans para /bundles
@router.get("", response_model=PaginatedResponse[SaaSCatalogBundleResponse])
async def list_plans_legacy(db: DbSession, page: int = Query(1), page_size: int = Query(20)):
    return await list_bundles(db, page, page_size)
