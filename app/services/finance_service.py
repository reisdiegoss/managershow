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
    
    # Mercado Público (Fase 26)
    valor_empenhado: Decimal = Decimal("0")
    valor_liquidado: Decimal = Decimal("0")

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
    receita_bruta = Decimal(str(show.real_cache))  # Valor REAL que fica na produtora
    valor_nota = Decimal(str(show.base_price))      # Valor NOMINAL da nota fiscal

    # --- Repasse de Produção (Prefeitura — NUNCA é lucro) ---
    repasse_producao = Decimal(str(show.production_kickback))

    # --- Impostos (REGRA DA BÍBLIA: Incidem sobre o REAL CACHE para Prefeituras) ---
    # Nota: Em shows privados, real_cache costuma ser igual ao valor da nota.
    tax_pct = Decimal(str(show.tax_percentage))
    impostos = receita_bruta * (tax_pct / Decimal("100"))

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
    
    # --- Mercado Público (Fase 26) ---
    valor_empenhado = Decimal("0")
    valor_liquidado = Decimal("0")

    from app.models.financial_transaction import PublicPaymentStatus

    for tx in transactions:
        amount = Decimal(str(tx.realized_amount))
        
        # Lógica de Custos
        if tx.type == TransactionType.PRODUCTION_COST:
            custos_producao += amount
        elif tx.type == TransactionType.LOGISTICS_COST:
            custos_colocacao += amount
        elif tx.type == TransactionType.EXTRA_EXPENSE:
            custos_extras += amount
            
        # Lógica de Empenho (Receitas)
        if tx.type == TransactionType.REVENUE:
            if tx.public_payment_status == PublicPaymentStatus.EMPENHADO:
                valor_empenhado += amount
            elif tx.public_payment_status == PublicPaymentStatus.LIQUIDADO:
                valor_liquidado += amount

    total_custos = custos_producao + custos_colocacao + custos_extras

    # --- Buscar comissões ---
    comm_stmt = tenant_query(Commission, tenant_id).where(
        Commission.show_id == show.id
    )
    comm_result = await db.execute(comm_stmt)
    commissions = comm_result.scalars().all()

    # --- Comissões sobre BRUTO (Intermediários) ---
    # REGRA DA BÍBLIA: Incidem sobre o REAL CACHE, nunca sobre o Kickback.
    comissoes_bruto = Decimal("0")
    comissoes_bruto_detalhes: list[CommissionDetail] = []
    for comm in commissions:
        if comm.commission_base == CommissionBase.GROSS:
            valor_comissao = receita_bruta * (Decimal(str(comm.percentage)) / Decimal("100"))
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

    from app.models.show import ShowStatus
    
    is_show_closed = show.status == ShowStatus.CONCLUIDO

    return DREResult(
        show_id=str(show.id),
        is_consolidated=is_show_closed,
        status="CONSOLIDADO" if is_show_closed else "PROVISÓRIO",
        valor_nota_fiscal=valor_nota,
        receita_bruta_cache=receita_bruta,
        valor_empenhado=valor_empenhado,
        valor_liquidado=valor_liquidado,
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
    Simula viabilidade financeira para uma cidade (BI Real).

    Lógica:
    1. Busca médias de custos reais em FinancialTransaction para shows passados na cidade.
    2. Fallback para CityBaseCost (histórico manual/referência) se não houver transações.
    3. Projeta DRE previsional.
    """
    from app.models.financial_transaction import TransactionCategory
    from app.models.show import Show

    twelve_months_ago = date.today() - timedelta(days=365)

    # --- 1. Buscar Médias Reais (FinancialTransaction) ---
    async def get_real_avg(category: TransactionCategory) -> Decimal:
        stmt = (
            select(func.avg(FinancialTransaction.realized_amount))
            .join(Show)
            .where(
                FinancialTransaction.tenant_id == tenant_id,
                FinancialTransaction.category == category,
                Show.location_city == city,
                Show.location_uf == uf,
                FinancialTransaction.created_at >= twelve_months_ago
            )
        )
        return Decimal(str((await db.execute(stmt)).scalar() or 0))

    real_flight = await get_real_avg(TransactionCategory.FLIGHT)
    real_hotel = await get_real_avg(TransactionCategory.HOTEL)

    # --- 2. Buscar Médias de Referência (CityBaseCost) ---
    async def get_ref_avg(category: str) -> Decimal:
        stmt = select(func.avg(CityBaseCost.cost_amount)).where(
            CityBaseCost.tenant_id == tenant_id,
            CityBaseCost.city == city,
            CityBaseCost.category == category,
            CityBaseCost.reference_date >= twelve_months_ago,
        )
        return Decimal(str((await db.execute(stmt)).scalar() or 0))

    ref_flight = await get_ref_avg("FLIGHT")
    ref_hotel = await get_ref_avg("HOTEL")

    # --- 3. Ponderação: Real tem prioridade sobre Referência ---
    avg_flight = real_flight if real_flight > 0 else ref_flight
    avg_hotel = real_hotel if real_hotel > 0 else ref_hotel

    # Projetar DRE
    projected_total_cost = avg_flight + avg_hotel
    projected_margin = cache - projected_total_cost
    margin_pct = (projected_margin / cache * Decimal("100")) if cache > 0 else Decimal("0")

    # VIABLE >= 20% de margem, RISKY < 20%
    status = "VIABLE" if margin_pct >= 20 else "RISKY"

    source = "DADOS REAIS" if (real_flight > 0 or real_hotel > 0) else "REFERÊNCIA"
    details = f"Simulação baseada em {source} para {city}/{uf}."
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
