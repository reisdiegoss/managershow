"""
Manager Show — Router: Shows (Client — Módulo 1: Agenda e Venda)

CRUD de shows com:
- Criação híbrida (Privado ou Público/Prefeitura)
- Cadastro on-the-fly de Contractor/Venue via objetos aninhados
- Filtros de negociação obrigatórios no Pydantic
- Simulador de viabilidade (GET /shows/simulate)
- Filtro obrigatório por tenant_id
"""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.permissions import require_permissions
from app.exceptions import ShowNotFoundException
from app.models.contractor import Contractor
from app.models.show import Show
from app.models.venue import Venue
from app.schemas.common import PaginatedResponse
from app.schemas.show import (
    ShowCreate,
    ShowResponse,
    ShowUpdate,
    SimulateRequest,
    SimulateResponse,
)

router = APIRouter(prefix="/shows", tags=["Client — Shows"])


@router.post("/", response_model=ShowResponse, status_code=201)
async def create_show(
    data: ShowCreate,
    db: DbSession,
    current_user: CurrentUser,
    tenant_id: TenantId,
) -> Show:
    """
    Cria um novo show na agenda.

    Suporta cadastro on-the-fly: se contractor_id ou venue_id não
    forem informados mas os objetos aninhados estiverem presentes,
    o backend cria as entidades automaticamente.
    """
    show_data = data.model_dump(exclude={"contractor", "venue"})
    show_data["tenant_id"] = tenant_id

    # --- Cadastro On-The-Fly: Contratante ---
    if not data.contractor_id and data.contractor:
        contractor = Contractor(
            tenant_id=tenant_id,
            **data.contractor.model_dump(),
        )
        db.add(contractor)
        await db.flush()
        show_data["contractor_id"] = contractor.id

    # --- Cadastro On-The-Fly: Local/Venue ---
    if not data.venue_id and data.venue:
        venue = Venue(
            tenant_id=tenant_id,
            **data.venue.model_dump(),
        )
        db.add(venue)
        await db.flush()
        show_data["venue_id"] = venue.id

    show = Show(**show_data)
    db.add(show)
    await db.flush()
    await db.refresh(show)
    return show


@router.get("/", response_model=PaginatedResponse[ShowResponse])
async def list_shows(
    db: DbSession,
    tenant_id: TenantId,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(None, description="Filtrar por status"),
    artist_id: uuid.UUID | None = Query(None, description="Filtrar por artista"),
) -> dict:
    """Lista shows do tenant com paginação e filtros opcionais."""
    filters = [Show.tenant_id == tenant_id]

    if status:
        filters.append(Show.status == status)
    if artist_id:
        filters.append(Show.artist_id == artist_id)

    # Total
    count_stmt = select(func.count()).select_from(Show).where(*filters)
    total = (await db.execute(count_stmt)).scalar() or 0

    # Registros paginados
    offset = (page - 1) * page_size
    stmt = (
        select(Show)
        .where(*filters)
        .offset(offset)
        .limit(page_size)
        .order_by(Show.date_show.desc())
    )
    result = await db.execute(stmt)
    shows = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size

    return {
        "items": shows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/simulate", response_model=SimulateResponse)
async def simulate_viability(
    db: DbSession,
    tenant_id: TenantId,
    city: str = Query(...),
    uf: str = Query(..., max_length=2),
    cache: Decimal = Query(..., ge=0),
    negotiation_type: str = Query(...),
) -> dict:
    """
    Simulador de Viabilidade Financeira.

    Busca médias de custo (AVG) de FLIGHT e HOTEL para a cidade
    nos últimos 12 meses e projeta um DRE provisório.

    Retorna status "VIABLE" (Verde) ou "RISKY" (Vermelho).
    Toda a matemática está isolada em finance_service.py.
    """
    from dataclasses import asdict

    from app.services.finance_service import simulate_viability as run_simulation

    result = await run_simulation(db, tenant_id, city, uf, cache)
    return asdict(result)


@router.get("/{show_id}", response_model=ShowResponse)
async def get_show(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> Show:
    """Busca um show pelo ID (filtrado por tenant)."""
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    return show


@router.patch("/{show_id}", response_model=ShowResponse)
async def update_show(
    show_id: uuid.UUID,
    data: ShowUpdate,
    db: DbSession,
    tenant_id: TenantId,
) -> Show:
    """
    Atualiza parcialmente um show.

    REGRA DA BÍBLIA (Regra 01): Não altera negotiation_type se contrato gerado.
    """
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(show, field, value)

    await db.flush()
    await db.refresh(show)
    return show
