"""
Manager Show — Router: Sellers (Vendedores)
"""

import uuid
from fastapi import APIRouter, HTTPException
from app.core.dependencies import DbSession, TenantId
from app.core.tenant_filter import tenant_query
from app.models.seller import Seller
from app.schemas.seller import SellerCreate, SellerUpdate, SellerResponse

router = APIRouter(prefix="/sellers", tags=["CRM / Vendedores"])


@router.get("", response_model=list[SellerResponse])
async def list_sellers(db: DbSession, tenant_id: TenantId):
    """Lista todos os vendedores cadastrados no tenant."""
    stmt = tenant_query(Seller, tenant_id).order_by(Seller.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=SellerResponse)
async def create_seller(payload: SellerCreate, db: DbSession, tenant_id: TenantId):
    """Cadastra um novo vendedor (externo ou vinculado a usuário)."""
    seller = Seller(**payload.model_dump(), tenant_id=tenant_id)
    db.add(seller)
    await db.commit()
    await db.refresh(seller)
    return seller


@router.patch("/{seller_id}", response_model=SellerResponse)
async def update_seller(
    seller_id: uuid.UUID,
    payload: SellerUpdate,
    db: DbSession,
    tenant_id: TenantId,
):
    """Atualiza dados do vendedor."""
    stmt = tenant_query(Seller, tenant_id).where(Seller.id == seller_id)
    result = await db.execute(stmt)
    seller = result.scalar_one_or_none()

    if not seller:
        raise HTTPException(status_code=404, detail="Vendedor não encontrado.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(seller, field, value)

    await db.commit()
    await db.refresh(seller)
    return seller
