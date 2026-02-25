"""
Manager Show — Router: Tickets / Help Desk (Retaguarda) — 100% Operacional

CRUD de tickets de suporte + respostas.
Fluxo: ABERTO → EM_ATENDIMENTO → RESOLVIDO / FECHADO
"""

import uuid

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import func, select

from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.models.ticket import Ticket, TicketReply, TicketStatus
from app.schemas.ticket import (
    TicketCreate,
    TicketReplyCreate,
    TicketReplyResponse,
    TicketResponse,
    TicketUpdate,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(
    prefix="/tickets", 
    tags=["Retaguarda — Tickets"],
    dependencies=[Depends(get_current_super_admin)]
)


@router.get("/", summary="List Tickets", response_model=PaginatedResponse[TicketResponse])
async def list_tickets(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: TicketStatus | None = Query(None, description="Filtrar por status"),
    q: str | None = Query(None, description="Busca por assunto ou conteúdo"),
) -> dict:
    """Lista todos os tickets de suporte."""
    count_stmt = select(func.count()).select_from(Ticket)
    if status:
        count_stmt = count_stmt.where(Ticket.status == status)
    if q:
        count_stmt = count_stmt.where(
            (Ticket.subject.ilike(f"%{q}%")) | (Ticket.description.ilike(f"%{q}%"))
        )
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = select(Ticket).order_by(Ticket.created_at.desc())
    if status:
        stmt = stmt.where(Ticket.status == status)
    if q:
        stmt = stmt.where(
            (Ticket.subject.ilike(f"%{q}%")) | (Ticket.description.ilike(f"%{q}%"))
        )
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    tickets = result.scalars().all()

    return {
        "items": tickets,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.post("/", summary="Create Ticket", response_model=TicketResponse, status_code=201)
async def create_ticket(
    payload: TicketCreate,
    db: DbSession,
    tenant_id: uuid.UUID | None = Query(None, description="Tenant ID (agência)"),
    user_id: uuid.UUID | None = Query(None, description="User ID (quem abriu)"),
) -> Ticket:
    """Cria um novo ticket de suporte."""
    ticket = Ticket(
        **payload.model_dump(),
        tenant_id=tenant_id,
        user_id=user_id,
    )
    db.add(ticket)
    await db.flush()
    await db.refresh(ticket)
    return ticket


@router.get("/{ticket_id}", summary="Get Ticket", response_model=TicketResponse)
async def get_ticket(
    ticket_id: uuid.UUID,
    db: DbSession,
) -> Ticket:
    """Busca um ticket específico pelo ID."""
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")
    return ticket


@router.patch("/{ticket_id}", summary="Update Ticket", response_model=TicketResponse)
async def update_ticket(
    ticket_id: uuid.UUID,
    payload: TicketUpdate,
    db: DbSession,
) -> Ticket:
    """Atualiza status/prioridade de um ticket."""
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(ticket, field, value)

    await db.flush()
    await db.refresh(ticket)
    return ticket


@router.post(
    "/{ticket_id}/reply",
    summary="Reply Ticket",
    response_model=TicketReplyResponse,
    status_code=201,
)
async def reply_ticket(
    ticket_id: uuid.UUID,
    payload: TicketReplyCreate,
    db: DbSession,
) -> TicketReply:
    """
    Adiciona uma resposta a um ticket.

    Ao responder, status muda automaticamente para EM_ATENDIMENTO.
    """
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    if ticket.status == TicketStatus.ABERTO:
        ticket.status = TicketStatus.EM_ATENDIMENTO

    reply = TicketReply(ticket_id=ticket_id, **payload.model_dump())
    db.add(reply)
    await db.flush()
    await db.refresh(reply)
    return reply


@router.get(
    "/{ticket_id}/replies",
    summary="List Ticket Replies",
    response_model=list[TicketReplyResponse],
)
async def list_ticket_replies(
    ticket_id: uuid.UUID,
    db: DbSession,
) -> list[TicketReply]:
    """Lista todas as respostas de um ticket."""
    stmt = select(Ticket).where(Ticket.id == ticket_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Ticket não encontrado.")

    replies_stmt = (
        select(TicketReply)
        .where(TicketReply.ticket_id == ticket_id)
        .order_by(TicketReply.created_at.asc())
    )
    replies_result = await db.execute(replies_stmt)
    return list(replies_result.scalars().all())
