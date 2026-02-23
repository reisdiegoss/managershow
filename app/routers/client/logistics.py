"""
Manager Show — Router: Logistics (Client — Módulo 3: Pré-Produção e Logística)

Lançamento de custos com validação Pydantic e categorização estrita.

TRAVA DE SEGURANÇA (Regra 02): Rejeita lançamento se
contract_validated == False.

AUDIT POINTS:
  ✅ Trava Mestra: Checa contract_validated ANTES do INSERT
  ✅ Decimal: Schema usa Decimal, nunca Float
  ✅ Tenant Isolation: tenant_query() filtra TODA query
"""

import uuid

from fastapi import APIRouter, Depends

from app.core.dependencies import DbSession, TenantId
from app.core.permissions import require_permissions
from app.core.tenant_filter import tenant_query
from app.exceptions import ContractNotSignedException, ShowNotFoundException
from app.models.financial_transaction import FinancialTransaction
from app.models.show import Show
from app.models.user import User
from app.schemas.financial_transaction import (
    FinancialTransactionCreate,
    FinancialTransactionResponse,
)

router = APIRouter(prefix="/shows/{show_id}/logistics", tags=["Client — Logística"])


@router.post(
    "/",
    summary="Add Logistics Cost",
    response_model=FinancialTransactionResponse,
    status_code=201,
)
async def add_logistics_cost(
    show_id: uuid.UUID,
    payload: FinancialTransactionCreate,
    db: DbSession,
    current_user: User = Depends(require_permissions("can_add_expenses")),
) -> FinancialTransaction:
    """
    Lança um custo de produção ou logística no show.

    TRAVA MESTRA (Regra 02 da Bíblia):
    Bloqueia lançamento se contract_validated == False.

    BODY validado pelo schema FinancialTransactionCreate (Pydantic V2 com Decimal).
    """
    tenant_id = current_user.tenant_id

    # Buscar show com filtro multi-tenant
    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    # TRAVA MESTRA — contrato deve estar validado
    if not show.contract_validated:
        raise ContractNotSignedException()

    # Criar transação financeira via schema validado
    transaction = FinancialTransaction(
        tenant_id=tenant_id,
        show_id=show_id,
        **payload.model_dump(),
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)
    return transaction


@router.get(
    "/",
    summary="List Logistics Costs",
    response_model=list[FinancialTransactionResponse],
)
async def list_logistics_costs(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> list[FinancialTransaction]:
    """Lista todos os lançamentos de custos do show (filtrado por tenant)."""
    stmt = tenant_query(FinancialTransaction, tenant_id).where(
        FinancialTransaction.show_id == show_id,
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
