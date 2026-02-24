"""
Manager Show — Router: Contractors (Client)
"""

import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DbSession, CurrentUser
from app.core.tenant_filter import tenant_query
from app.models.contractor import Contractor
from app.models.contractor_note import ContractorNote
from app.models.show import Show
from app.schemas.contractor import ContractorCreate, ContractorResponse
from app.schemas.contractor_note import ContractorNoteCreate, ContractorNoteResponse, ContractorNoteBase
from app.schemas.show import ShowResponse
from app.schemas.contractor_note import ContractorNoteCreate, ContractorNoteResponse
from app.schemas.show import ShowResponse

router = APIRouter(prefix="/contractors", tags=["Client — Contratantes"])


@router.get("/", response_model=list[ContractorResponse])
async def list_contractors(
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Lista todos os contratantes do tenant.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(Contractor, tenant_id).order_by(Contractor.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ContractorResponse, status_code=201)
async def create_contractor(
    payload: ContractorCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Cria um novo contratante para o tenant.
    """
    tenant_id = current_user.tenant_id
    contractor = Contractor(
        tenant_id=tenant_id,
        **payload.model_dump()
    )
    db.add(contractor)
    await db.flush()
    await db.refresh(contractor)
    return contractor


@router.get("/{contractor_id}/notes", response_model=list[ContractorNoteResponse])
async def list_contractor_notes(
    contractor_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
):
    """Retorna a timeline de notas de um contratante."""
    tenant_id = current_user.tenant_id
    stmt = (
        tenant_query(ContractorNote, tenant_id)
        .where(ContractorNote.contractor_id == contractor_id)
        .order_by(ContractorNote.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{contractor_id}/notes", response_model=ContractorNoteResponse)
async def create_contractor_note(
    contractor_id: uuid.UUID,
    payload: ContractorNoteBase,  # Usando o base para pegar só o content
    db: DbSession,
    current_user: CurrentUser,
):
    """Adiciona uma nova nota comercial ao histórico do contratante."""
    tenant_id = current_user.tenant_id
    note = ContractorNote(
        tenant_id=tenant_id,
        contractor_id=contractor_id,
        content=payload.content,
        author_id=current_user.id
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


@router.get("/{contractor_id}/shows", response_model=list[ShowResponse])
async def list_contractor_shows(
    contractor_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
):
    """Retorna todos os shows vinculados a este contratante (Histórico)."""
    tenant_id = current_user.tenant_id
    stmt = (
        tenant_query(Show, tenant_id)
        .where(Show.contractor_id == contractor_id)
        .order_by(Show.date_start.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()
