"""
Manager Show — Router: Plans (Retaguarda / Super Admin)

Gestão dos planos e pacotes do SaaS.
"""

import uuid
from fastapi import APIRouter, Query, Depends, HTTPException
from sqlalchemy import func, select
from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.models.plan import Plan
from app.schemas.common import PaginatedResponse
from app.schemas.plan import PlanCreate, PlanResponse, PlanUpdate

router = APIRouter(
    prefix="/plans", 
    tags=["Retaguarda — Planos"],
    dependencies=[Depends(get_current_super_admin)]
)

@router.post("", response_model=PlanResponse, status_code=201)
async def create_plan(
    data: PlanCreate,
    db: DbSession,
) -> Plan:
    """Cria um novo plano SaaS."""
    plan = Plan(**data.model_dump())
    db.add(plan)
    await db.flush()
    await db.refresh(plan)
    return plan

@router.get("", response_model=PaginatedResponse[PlanResponse])
async def list_plans(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict:
    """Lista todos os planos com paginação."""
    offset = (page - 1) * page_size

    # Total de registros
    count_stmt = select(func.count()).select_from(Plan)
    total = (await db.execute(count_stmt)).scalar() or 0

    # Registros paginados
    stmt = select(Plan).offset(offset).limit(page_size).order_by(Plan.created_at.desc())
    result = await db.execute(stmt)
    plans = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return {
        "items": plans,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }

@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: uuid.UUID,
    db: DbSession,
) -> Plan:
    """Busca um plano pelo ID."""
    stmt = select(Plan).where(Plan.id == plan_id)
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    return plan

@router.patch("/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: uuid.UUID,
    data: PlanUpdate,
    db: DbSession,
) -> Plan:
    """Atualiza um plano."""
    stmt = select(Plan).where(Plan.id == plan_id)
    result = await db.execute(stmt)
    plan = result.scalar_one_or_none()

    if not plan:
        raise HTTPException(status_code=404, detail="Plano não encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    await db.flush()
    await db.refresh(plan)
    return plan
