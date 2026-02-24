"""
Manager Show — Router: Commercial Leads (CRM)
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import DbSession
from app.core.auth import TenantId
from app.models.commercial_lead import CommercialLead, CommercialLeadStatus
from app.models.show import Show, ShowStatus
from app.schemas.commercial_lead import CommercialLeadCreate, CommercialLeadUpdate, CommercialLeadResponse
from app.schemas.show import ShowResponse
from app.core.database import tenant_query

router = APIRouter(prefix="/leads", tags=["CRM / Leads"])


@router.get("", response_model=list[CommercialLeadResponse])
async def list_leads(
    db: DbSession,
    tenant_id: TenantId,
    status: CommercialLeadStatus | None = Query(None),
):
    """Lista os leads do funil de vendas do tenant."""
    stmt = tenant_query(CommercialLead, tenant_id).order_by(CommercialLead.created_at.desc())
    if status:
        stmt = stmt.where(CommercialLead.status == status)
    
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=CommercialLeadResponse)
async def create_lead(
    payload: CommercialLeadCreate,
    db: DbSession,
    tenant_id: TenantId,
):
    """Cria um novo lead no funil de vendas."""
    lead = CommercialLead(
        **payload.model_dump(),
        tenant_id=tenant_id,
        status=CommercialLeadStatus.PROSPECÇÃO
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    return lead


@router.patch("/{lead_id}", response_model=CommercialLeadResponse)
async def update_lead(
    lead_id: uuid.UUID,
    payload: CommercialLeadUpdate,
    db: DbSession,
    tenant_id: TenantId,
):
    """Atualiza dados ou status de um lead."""
    stmt = tenant_query(CommercialLead, tenant_id).where(CommercialLead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)

    await db.commit()
    await db.refresh(lead)
    return lead


@router.post("/{lead_id}/convert", response_model=ShowResponse)
async def convert_lead_to_show(
    lead_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    Converte um Lead em um Show oficial.
    Este endpoint marca o lead como GANHO e retorna os dados base para criar o Show.
    """
    stmt = tenant_query(CommercialLead, tenant_id).where(CommercialLead.id == lead_id)
    result = await db.execute(stmt)
    lead = result.scalar_one_or_none()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead não encontrado.")
    
    if lead.status == CommercialLeadStatus.GANHO:
        raise HTTPException(status_code=400, detail="Este lead já foi convertido.")

    lead.status = CommercialLeadStatus.GANHO
    await db.commit()
    
    # Nota: No frontend, isso acionará a abertura do modal de Novo Show pré-preenchido.
    # Aqui retornamos os dados que o frontend deve usar.
    return lead
