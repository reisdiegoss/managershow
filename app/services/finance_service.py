"""
Manager Show — Service: Motor Financeiro (DRE + Simulador)

TODA a matemática financeira do sistema está isolada AQUI.
Os routers APENAS chamam estas funções — nunca fazem cálculos.

Fórmula do DRE (Bíblia do Produto):
    (+) Receita Bruta (Cachê Real)
    (-) Impostos da Nota Fiscal
    (-) Repasse de Produção (Prefeitura — NUNCA é lucro)
    (-) Custos de Produção (Etapa 3)
    (-) Custos de Colocação (Etapa 3) + Extras (Etapa 5)
    (-) Comissões sobre BRUTO (intermediários)
    (=) Lucro Líquido (Liquidez Real)
    (-) Comissões sobre LÍQUIDO (escritório/sócios)
    (=) Resultado Final
"""

import uuid
from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant_filter import tenant_query
from app.models.city_base_cost import CityBaseCost
from app.models.commission import Commission, CommissionBase
from app.models.financial_transaction import (
    FinancialTransaction,
    TransactionType,
)
from app.models.show import Show


# =============================================================================
# DTOs (Data Transfer Objects) — resultados estruturados
# =============================================================================


@dataclass
class CommissionDetail:
    """Detalhes de uma comissão calculada."""
    beneficiary: str
    percentage: Decimal
    base: str  # "GROSS" ou "NET"
    value: Decimal


@dataclass
class DREResult:
    """Resultado completo do DRE."""
    show_id: str
    is_consolidated: bool
    status: str  # "CONSOLIDADO" ou "PROVISÓRIO"

    # Receita
    valor_nota_fiscal: Decimal
    receita_bruta_cache: Decimal

    # Deduções
    impostos: Decimal
    tax_percentage: Decimal
    repasse_producao: Decimal

    # Custos
    custos_producao: Decimal
    custos_colocacao: Decimal
    custos_extras: Decimal
    total_custos: Decimal

    # Comissões sobre Bruto
    comissoes_bruto: Decimal
    comissoes_bruto_detalhes: list[CommissionDetail] = field(default_factory=list)

    # Lucro Líquido
    lucro_liquido: Decimal = Decimal("0")

    # Comissões sobre Líquido
    comissoes_liquido: Decimal = Decimal("0")
    comissoes_liquido_detalhes: list[CommissionDetail] = field(default_factory=list)

    # Resultado Final
    resultado_final: Decimal = Decimal("0")
    margem_percentual: Decimal = Decimal("0")


@dataclass
class SimulationResult:
    """Resultado do Simulador de Viabilidade."""
    status: str  # "VIABLE" ou "RISKY"
    projected_revenue: Decimal
    projected_flight_cost: Decimal
    projected_hotel_cost: Decimal
    projected_total_cost: Decimal
    projected_margin: Decimal
    margin_percentage: Decimal
    details: str | None = None


# =============================================================================
# Motor do DRE — cálculo em tempo real
# =============================================================================


async def calculate_dre(
    db: AsyncSession,
    show: Show,
    tenant_id: uuid.UUID,
) -> DREResult:
    """
    Calcula o DRE completo de um show em tempo real.

    O resultado NUNCA é armazenado — sempre calculado on-the-fly
    a partir dos dados financeiros lançados nas Etapas 3 e 5.
    """
    # --- Receita ---
    receita_bruta = Decimal(str(show.real_cache))
    valor_nota = Decimal(str(show.base_price))

    # --- Impostos sobre a Nota Fiscal ---
    tax_pct = Decimal(str(show.tax_percentage))
    impostos = valor_nota * (tax_pct / Decimal("100"))

    # --- Repasse de Produção (Prefeitura — NUNCA é lucro) ---
    repasse_producao = Decimal(str(show.production_kickback))

    # --- Buscar todas as transações financeiras ---
    stmt = tenant_query(FinancialTransaction, tenant_id).where(
        FinancialTransaction.show_id == show.id
    )
    result = await db.execute(stmt)
    transactions = result.scalars().all()

    # --- Separar custos por tipo ---
    custos_producao = Decimal("0")
    custos_colocacao = Decimal("0")
    custos_extras = Decimal("0")

    for tx in transactions:
        amount = Decimal(str(tx.realized_amount))
        if tx.type == TransactionType.PRODUCTION_COST:
            custos_producao += amount
        elif tx.type == TransactionType.LOGISTICS_COST:
            custos_colocacao += amount
        elif tx.type == TransactionType.EXTRA_EXPENSE:
            custos_extras += amount

    total_custos = custos_producao + custos_colocacao + custos_extras

    # --- Buscar comissões ---
    comm_stmt = tenant_query(Commission, tenant_id).where(
        Commission.show_id == show.id
    )
    comm_result = await db.execute(comm_stmt)
    commissions = comm_result.scalars().all()

    # --- Comissões sobre BRUTO (intermediários) ---
    comissoes_bruto = Decimal("0")
    comissoes_bruto_detalhes: list[CommissionDetail] = []
    for comm in commissions:
        if comm.commission_base == CommissionBase.GROSS:
            valor_comissao = valor_nota * (Decimal(str(comm.percentage)) / Decimal("100"))
            comissoes_bruto += valor_comissao
            comissoes_bruto_detalhes.append(CommissionDetail(
                beneficiary=comm.beneficiary_name,
                percentage=Decimal(str(comm.percentage)),
                base="GROSS",
                value=valor_comissao,
            ))

    # --- Lucro Líquido (Liquidez Real) ---
    lucro_liquido = (
        receita_bruta
        - impostos
        - repasse_producao
        - total_custos
        - comissoes_bruto
    )

    # --- Comissões sobre LÍQUIDO (escritório/sócios) ---
    comissoes_liquido = Decimal("0")
    comissoes_liquido_detalhes: list[CommissionDetail] = []
    for comm in commissions:
        if comm.commission_base == CommissionBase.NET:
            valor_comissao = lucro_liquido * (Decimal(str(comm.percentage)) / Decimal("100"))
            # Comissão sobre líquido nunca pode ser negativa
            if valor_comissao < 0:
                valor_comissao = Decimal("0")
            comissoes_liquido += valor_comissao
            comissoes_liquido_detalhes.append(CommissionDetail(
                beneficiary=comm.beneficiary_name,
                percentage=Decimal(str(comm.percentage)),
                base="NET",
                value=valor_comissao,
            ))

    # --- Resultado Final ---
    resultado_final = lucro_liquido - comissoes_liquido

    # --- Margem ---
    margem = (
        (resultado_final / receita_bruta * Decimal("100"))
        if receita_bruta > 0 else Decimal("0")
    )

    return DREResult(
        show_id=str(show.id),
        is_consolidated=show.road_closed,
        status="CONSOLIDADO" if show.road_closed else "PROVISÓRIO",
        valor_nota_fiscal=valor_nota,
        receita_bruta_cache=receita_bruta,
        impostos=impostos,
        tax_percentage=tax_pct,
        repasse_producao=repasse_producao,
        custos_producao=custos_producao,
        custos_colocacao=custos_colocacao,
        custos_extras=custos_extras,
        total_custos=total_custos,
        comissoes_bruto=comissoes_bruto,
        comissoes_bruto_detalhes=comissoes_bruto_detalhes,
        lucro_liquido=lucro_liquido,
        comissoes_liquido=comissoes_liquido,
        comissoes_liquido_detalhes=comissoes_liquido_detalhes,
        resultado_final=resultado_final,
        margem_percentual=round(margem, 2),
    )


# =============================================================================
# Simulador de Viabilidade Financeira
# =============================================================================


async def simulate_viability(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    city: str,
    uf: str,
    cache: Decimal,
) -> SimulationResult:
    """
    Simula viabilidade financeira para uma cidade.

    Busca AVG de custos de FLIGHT e HOTEL nos últimos 12 meses
    e projeta um DRE provisório para retornar VIABLE ou RISKY.
    """
    twelve_months_ago = date.today() - timedelta(days=365)

    # Custo médio de voo
    flight_stmt = select(func.avg(CityBaseCost.cost_amount)).where(
        CityBaseCost.tenant_id == tenant_id,
        CityBaseCost.city == city,
        CityBaseCost.category == "FLIGHT",
        CityBaseCost.reference_date >= twelve_months_ago,
    )
    avg_flight = Decimal(str((await db.execute(flight_stmt)).scalar() or 0))

    # Custo médio de hotel
    hotel_stmt = select(func.avg(CityBaseCost.cost_amount)).where(
        CityBaseCost.tenant_id == tenant_id,
        CityBaseCost.city == city,
        CityBaseCost.category == "HOTEL",
        CityBaseCost.reference_date >= twelve_months_ago,
    )
    avg_hotel = Decimal(str((await db.execute(hotel_stmt)).scalar() or 0))

    # Projetar DRE
    projected_total_cost = avg_flight + avg_hotel
    projected_margin = cache - projected_total_cost
    margin_pct = (projected_margin / cache * Decimal("100")) if cache > 0 else Decimal("0")

    # VIABLE >= 20% de margem, RISKY < 20%
    status = "VIABLE" if margin_pct >= 20 else "RISKY"

    details = None
    if avg_flight == 0 and avg_hotel == 0:
        details = f"Sem histórico de custos para {city}/{uf}. Simulação baseada apenas no cachê."

    return SimulationResult(
        status=status,
        projected_revenue=cache,
        projected_flight_cost=avg_flight,
        projected_hotel_cost=avg_hotel,
        projected_total_cost=projected_total_cost,
        projected_margin=projected_margin,
        margin_percentage=round(margin_pct, 2),
        details=details,
    )
