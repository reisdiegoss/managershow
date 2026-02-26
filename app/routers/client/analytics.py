from datetime import date
from typing import List
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, DbSession
from app.core.tenant_filter import tenant_query
from app.models.financial_transaction import FinancialTransaction, TransactionType
from app.models.show import Show

router = APIRouter(prefix="/analytics", tags=["Client — Analytics & Cockpit"])

# --- DTOs ---

class PerformanceByArtistItem(BaseModel):
    artist_id: str
    artist_name: str
    total_shows: int
    gross_revenue: float
    total_costs: float
    net_profit: float
    profit_margin: float

class PerformanceDashboardResponse(BaseModel):
    items: List[PerformanceByArtistItem]
    global_gross: float
    global_costs: float
    global_net: float


@router.get("/performance/artists", response_model=PerformanceDashboardResponse)
async def get_performance_by_artist(
    current_user: CurrentUser,
    db: DbSession,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """
    Agrupa todo o Faturamento (Baseado nas Notas e Real Cache) vs Custos Reais (Etapa 3/5)
    e com isso constrói um Cockpit 360 para a Tela de Dashboards.
    """
    tenant_id = current_user.tenant_id

    # O PostgreSQL fará o trabalho pesado:
    # Pra cada artista, somamos a quantidade de shows realizados, 
    # a soma de "real_cache" deles e buscamos a soma condicional das transactions.

    # 1. Agrupar os dados da tabela de SHOWS (Receita Primária)
    show_stmt = select(
        Show.artist_id,
        func.count(Show.id).label("qdt_shows"),
        func.sum(Show.real_cache).label("sum_cache")
    ).where(Show.tenant_id == tenant_id)

    if start_date:
        show_stmt = show_stmt.where(Show.date_show >= start_date)
    if end_date:
        show_stmt = show_stmt.where(Show.date_show <= end_date)

    show_stmt = show_stmt.group_by(Show.artist_id)
    shows_res = await db.execute(show_stmt)
    shows_data = shows_res.all()

    # 2. Agrupar os custos das transactions por Show_id e re-agrupar no python
    tx_stmt = select(
        FinancialTransaction.show_id,
        func.sum(FinancialTransaction.realized_amount).label("sum_tx")
    ).where(
        FinancialTransaction.tenant_id == tenant_id,
        FinancialTransaction.type.in_([
            TransactionType.LOGISTICS_COST, 
            TransactionType.PRODUCTION_COST, 
            TransactionType.EXTRA_EXPENSE
        ])
    ).group_by(FinancialTransaction.show_id)
    tx_res = await db.execute(tx_stmt)
    tx_costs_by_show = {str(row.show_id): float(row.sum_tx or 0.0) for row in tx_res.all()}

    # 3. Precisamos dos ID / Nomes dos artistas
    from app.models.artist import Artist
    artist_stmt = tenant_query(Artist, tenant_id)
    artists_res = await db.execute(artist_stmt)
    artists_map = {str(a.id): a.name for a in artists_res.scalars().all()}

    # O(N) Merge na mão, bem leve em Python pois as bases vem consolidadas da query.
    # Mas como as tx são group by Show_id, precisamos rebuscar quais show_ids pertencem a quais artistas.
    # Para evitar Loop em Loop, rodamos mais uma query indexada:
    show_artist_map_stmt = select(Show.id, Show.artist_id).where(Show.tenant_id == tenant_id)
    sam_res = await db.execute(show_artist_map_stmt)
    show_artist_map = {str(row.id): str(row.artist_id) for row in sam_res.all()}

    # Merge Costs by Artist
    costs_by_artist = {}
    for show_id, sum_tx in tx_costs_by_show.items():
        art_id = show_artist_map.get(show_id)
        if art_id:
            costs_by_artist[art_id] = costs_by_artist.get(art_id, 0.0) + sum_tx

    # 4. Formatação Final DTO
    items = []
    glb_gross = 0.0
    glb_costs = 0.0

    for row in shows_data:
        art_id = str(row.artist_id)
        gross = float(row.sum_cache or 0.0)
        costs = costs_by_artist.get(art_id, 0.0)
        net = gross - costs
        margin = (net / gross * 100.0) if gross > 0 else 0.0

        glb_gross += gross
        glb_costs += costs

        items.append(
            PerformanceByArtistItem(
                artist_id=art_id,
                artist_name=artists_map.get(art_id, "Desconhecido"),
                total_shows=int(row.qdt_shows or 0),
                gross_revenue=gross,
                total_costs=costs,
                net_profit=net,
                profit_margin=round(margin, 2)
            )
        )

    # Ordenar por margem e grana
    items.sort(key=lambda x: x.net_profit, reverse=True)

    return PerformanceDashboardResponse(
        items=items,
        global_gross=glb_gross,
        global_costs=glb_costs,
        global_net=glb_gross - glb_costs
    )
