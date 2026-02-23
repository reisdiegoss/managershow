"""
Manager Show — Router: DRE (Client — Módulo 6: Borderô e DRE Automático)

Endpoint GET que calcula o DRE em tempo real — NÃO armazena.

Fórmula Base:
    (+) Receita Bruta (Cachê Real)
    (-) Impostos da Nota Fiscal
    (-) Repasse de Produção (Prefeitura — NUNCA é lucro)
    (-) Custos de Produção (Etapa 3)
    (-) Custos de Colocação (Etapa 3) + Extras (Etapa 5)
    (-) Comissão de Intermediários (sobre o Bruto)
    (=) Lucro Líquido (Liquidez Real)
    (-) Comissão do Escritório (sobre o Lucro Líquido)
    (=) Resultado Final

REGRA DA BÍBLIA (Regra 03): DRE consolidado só após check-in (Etapa 5).
"""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DbSession
from app.core.permissions import require_permissions
from app.exceptions import ShowNotFoundException
from app.models.commission import Commission, CommissionBase
from app.models.financial_transaction import (
    FinancialTransaction,
    TransactionType,
)
from app.models.show import Show
from app.models.user import User

router = APIRouter(prefix="/shows/{show_id}/dre", tags=["Client — DRE"])


@router.get("/")
async def get_dre(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: User = Depends(require_permissions("can_view_dre")),
) -> dict:
    """
    Calcula o DRE (Demonstrativo de Resultado) em tempo real.

    A calculadora central do Manager Show. Cruza receitas,
    custos, impostos e comissões para gerar o borderô completo.

    Se road_closed == False, retorna DRE provisório (estimativa).
    """
    tenant_id = current_user.tenant_id

    # --- Buscar Show ---
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # --- Receita Bruta ---
    receita_bruta = Decimal(str(show.real_cache))
    valor_nota = Decimal(str(show.base_price))

    # --- Impostos sobre a Nota Fiscal ---
    tax_pct = Decimal(str(show.tax_percentage))
    impostos = valor_nota * (tax_pct / Decimal("100"))

    # --- Repasse de Produção (Prefeituras — NUNCA é lucro) ---
    repasse_producao = Decimal(str(show.production_kickback))

    # --- Buscar todas as transações financeiras do show ---
    tx_stmt = select(FinancialTransaction).where(
        FinancialTransaction.show_id == show_id,
        FinancialTransaction.tenant_id == tenant_id,
    )
    tx_result = await db.execute(tx_stmt)
    transactions = tx_result.scalars().all()

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
    comm_stmt = select(Commission).where(
        Commission.show_id == show_id,
        Commission.tenant_id == tenant_id,
    )
    comm_result = await db.execute(comm_stmt)
    commissions = comm_result.scalars().all()

    # --- Comissões sobre BRUTO (intermediários) ---
    comissoes_bruto = Decimal("0")
    comissoes_bruto_detalhes = []
    for comm in commissions:
        if comm.commission_base == CommissionBase.GROSS:
            valor_comissao = valor_nota * (Decimal(str(comm.percentage)) / Decimal("100"))
            comissoes_bruto += valor_comissao
            comissoes_bruto_detalhes.append({
                "beneficiary": comm.beneficiary_name,
                "percentage": str(comm.percentage),
                "base": "GROSS",
                "value": str(valor_comissao),
            })

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
    comissoes_liquido_detalhes = []
    for comm in commissions:
        if comm.commission_base == CommissionBase.NET:
            valor_comissao = lucro_liquido * (Decimal(str(comm.percentage)) / Decimal("100"))
            # Comissão sobre líquido nunca pode ser negativa
            if valor_comissao < 0:
                valor_comissao = Decimal("0")
            comissoes_liquido += valor_comissao
            comissoes_liquido_detalhes.append({
                "beneficiary": comm.beneficiary_name,
                "percentage": str(comm.percentage),
                "base": "NET",
                "value": str(valor_comissao),
            })

    # --- Resultado Final ---
    resultado_final = lucro_liquido - comissoes_liquido

    # --- Margem de Lucro ---
    margem = (
        (resultado_final / receita_bruta * Decimal("100"))
        if receita_bruta > 0 else Decimal("0")
    )

    return {
        "show_id": str(show_id),
        "is_consolidated": show.road_closed,
        "status": "CONSOLIDADO" if show.road_closed else "PROVISÓRIO",

        # --- Receita ---
        "valor_nota_fiscal": str(valor_nota),
        "receita_bruta_cache": str(receita_bruta),

        # --- Deduções ---
        "impostos": str(impostos),
        "tax_percentage": str(tax_pct),
        "repasse_producao": str(repasse_producao),

        # --- Custos ---
        "custos_producao": str(custos_producao),
        "custos_colocacao": str(custos_colocacao),
        "custos_extras": str(custos_extras),
        "total_custos": str(total_custos),

        # --- Comissões sobre Bruto ---
        "comissoes_bruto": str(comissoes_bruto),
        "comissoes_bruto_detalhes": comissoes_bruto_detalhes,

        # --- Lucro Líquido ---
        "lucro_liquido": str(lucro_liquido),

        # --- Comissões sobre Líquido ---
        "comissoes_liquido": str(comissoes_liquido),
        "comissoes_liquido_detalhes": comissoes_liquido_detalhes,

        # --- Resultado Final ---
        "resultado_final": str(resultado_final),
        "margem_percentual": str(round(margem, 2)),
    }
