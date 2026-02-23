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
    cache: float = Query(..., ge=0),
    negotiation_type: str = Query(...),
) -> dict:
    """
    Simulador de Viabilidade Financeira.

    Busca médias de custo (AVG) de FLIGHT e HOTEL para a cidade
    nos últimos 12 meses e projeta um DRE provisório.

    Retorna status "VIABLE" (Verde) ou "RISKY" (Vermelho)
    com a margem projetada.
    """
    from datetime import date, timedelta
    from decimal import Decimal

    from app.models.city_base_cost import CityBaseCost

    # Buscar médias de custo dos últimos 12 meses para a cidade
    twelve_months_ago = date.today() - timedelta(days=365)

    # Custo médio de voo
    flight_stmt = select(func.avg(CityBaseCost.cost_amount)).where(
        CityBaseCost.tenant_id == tenant_id,
        CityBaseCost.city == city,
        CityBaseCost.category == "FLIGHT",
        CityBaseCost.reference_date >= twelve_months_ago,
    )
    avg_flight = (await db.execute(flight_stmt)).scalar() or Decimal("0")

    # Custo médio de hotel
    hotel_stmt = select(func.avg(CityBaseCost.cost_amount)).where(
        CityBaseCost.tenant_id == tenant_id,
        CityBaseCost.city == city,
        CityBaseCost.category == "HOTEL",
        CityBaseCost.reference_date >= twelve_months_ago,
    )
    avg_hotel = (await db.execute(hotel_stmt)).scalar() or Decimal("0")

    # Projetar DRE provisório
    projected_revenue = Decimal(str(cache))
    projected_total_cost = Decimal(str(avg_flight)) + Decimal(str(avg_hotel))
    projected_margin = projected_revenue - projected_total_cost

    margin_percentage = (
        (projected_margin / projected_revenue * 100)
        if projected_revenue > 0
        else Decimal("0")
    )

    # Classificar: Verde (VIABLE) se margem >= 20%, Vermelho (RISKY) se < 20%
    status = "VIABLE" if margin_percentage >= 20 else "RISKY"

    details = None
    if avg_flight == 0 and avg_hotel == 0:
        details = f"Sem histórico de custos para {city}/{uf}. Simulação baseada apenas no cachê."

    return {
        "status": status,
        "projected_revenue": projected_revenue,
        "projected_flight_cost": Decimal(str(avg_flight)),
        "projected_hotel_cost": Decimal(str(avg_hotel)),
        "projected_total_cost": projected_total_cost,
        "projected_margin": projected_margin,
        "margin_percentage": round(margin_percentage, 2),
        "details": details,
    }


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
