"""
Manager Show — Router: CRM (Retaguarda) — 100% Operacional

CRUD completo de Leads para prospecção de novos clientes do SaaS.
"""

import uuid

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import func, select

from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.models.saas_lead import SaaSLead, SaaSLeadStatus
from app.schemas.saas_lead import SaaSLeadCreate, SaaSLeadResponse, SaaSLeadUpdate
from app.schemas.common import PaginatedResponse

router = APIRouter(
    prefix="/crm", 
    tags=["Retaguarda — CRM"],
    dependencies=[Depends(get_current_super_admin)]
)


@router.get("/leads", summary="List Leads", response_model=PaginatedResponse[SaaSLeadResponse])
async def list_leads(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: SaaSLeadStatus | None = Query(None, description="Filtrar por status"),
) -> dict:
    """Lista os leads do funil de prospecção."""
    count_stmt = select(func.count()).select_from(SaaSLead)
    if status:
        count_stmt = count_stmt.where(SaaSLead.status == status)
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = select(SaaSLead).order_by(SaaSLead.created_at.desc())
    if status:
        stmt = stmt.where(SaaSLead.status == status)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    leads = result.scalars().all()

    return {
        "items": leads,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("/leads", summary="Create Lead", response_model=SaaSLeadResponse, status_code=201)
async def create_lead(
    payload: SaaSLeadCreate,
    db: DbSession,
) -> SaaSLead:
    """Cria um novo lead no funil de prospecção."""
    lead = SaaSLead(**payload.model_dump())
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return lead


@router.get("/leads/{lead_id}", summary="Get Lead", response_model=SaaSLeadResponse)
async def get_lead(
    lead_id: uuid.UUID,
    db: DbSession,
) -> SaaSLead:
    """Busca um lead específico pelo ID."""
    stmt = select(SaaSLead).where(SaaSLead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    return lead


@router.patch("/leads/{lead_id}", summary="Update Lead", response_model=SaaSLeadResponse)
async def update_lead(
    lead_id: uuid.UUID,
    payload: SaaSLeadUpdate,
    db: DbSession,
) -> SaaSLead:
    """Atualiza parcialmente um lead (ex: avançar no funil)."""
    stmt = select(SaaSLead).where(SaaSLead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)

    await db.flush()
    await db.refresh(lead)
    return lead


@router.delete("/leads/{lead_id}", summary="Delete Lead", status_code=204)
async def delete_lead(
    lead_id: uuid.UUID,
    db: DbSession,
) -> None:
    """Remove um lead do funil."""
    stmt = select(SaaSLead).where(SaaSLead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    await db.delete(lead)
    await db.flush()
