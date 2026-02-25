"""
Manager Show — Router: CRM (Retaguarda) — 100% Operacional

CRUD completo de Leads para prospecção de novos escritórios/agências.
Funil de vendas: NOVO → CONTATADO → QUALIFICADO → PROPOSTA → CONVERTIDO / PERDIDO
"""

import uuid

from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy import func, select

from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.models.lead import Lead, LeadStatus
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.schemas.common import PaginatedResponse

router = APIRouter(
    prefix="/crm", 
    tags=["Retaguarda — CRM"],
    dependencies=[Depends(get_current_super_admin)]
)


@router.get("/leads", summary="List Leads", response_model=PaginatedResponse[LeadResponse])
async def list_leads(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: LeadStatus | None = Query(None, description="Filtrar por status"),
) -> dict:
    """Lista os leads do funil de prospecção."""
    count_stmt = select(func.count()).select_from(Lead)
    if status:
        count_stmt = count_stmt.where(Lead.status == status)
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = select(Lead).order_by(Lead.created_at.desc())
    if status:
        stmt = stmt.where(Lead.status == status)
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


@router.post("/leads", summary="Create Lead", response_model=LeadResponse, status_code=201)
async def create_lead(
    payload: LeadCreate,
    db: DbSession,
) -> Lead:
    """Cria um novo lead no funil de prospecção."""
    lead = Lead(**payload.model_dump())
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return lead


@router.get("/leads/{lead_id}", summary="Get Lead", response_model=LeadResponse)
async def get_lead(
    lead_id: uuid.UUID,
    db: DbSession,
) -> Lead:
    """Busca um lead específico pelo ID."""
    stmt = select(Lead).where(Lead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    return lead


@router.patch("/leads/{lead_id}", summary="Update Lead", response_model=LeadResponse)
async def update_lead(
    lead_id: uuid.UUID,
    payload: LeadUpdate,
    db: DbSession,
) -> Lead:
    """Atualiza parcialmente um lead (ex: avançar no funil)."""
    stmt = select(Lead).where(Lead.id == lead_id)
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
    stmt = select(Lead).where(Lead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    await db.delete(lead)
    await db.flush()
