"""
Manager Show — Router: Logistics (Client — Módulo 3: Pré-Produção e Logística)

Lançamento de custos reais com categorização estrita:
- Custo de Produção (Equipe, Backline, Som)
- Custo de Colocação (Aéreo, Hotel, Terrestre, Transfer)

TRAVA DE SEGURANÇA: Rejeita POST/PUT com HTTP 403 se
o contrato do show NÃO estiver validado (contract_validated == False).

Gera flag budget_overflow se lançamento ultrapassa o orçado.
"""

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DbSession, TenantId
from app.core.permissions import require_permissions
from app.exceptions import ContractNotSignedException, ShowNotFoundException
from app.models.financial_transaction import (
    FinancialTransaction,
    TransactionCategory,
    TransactionType,
)
from app.models.show import Show
from app.models.user import User

router = APIRouter(prefix="/shows/{show_id}/logistics", tags=["Client — Logística"])


@router.post("/", status_code=201)
async def add_logistics_cost(
    show_id: uuid.UUID,
    type: TransactionType,
    category: TransactionCategory,
    description: str | None = None,
    budgeted_amount: Decimal = Decimal("0"),
    realized_amount: Decimal = Decimal("0"),
    receipt_url: str | None = None,
    db: DbSession = None,
    current_user: User = Depends(require_permissions("can_add_expenses")),
) -> dict:
    """
    Lança um custo de produção ou logística no show.

    TRAVA DE SEGURANÇA (Regra 02 da Bíblia):
    Bloqueia lançamento se contract_validated == False.

    Alerta de budget_overflow se realized_amount > budgeted_amount.
    """
    tenant_id = current_user.tenant_id

    # Buscar show e verificar tenant
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    # TRAVA MESTRA — contrato deve estar validado
    if not show.contract_validated:
        raise ContractNotSignedException()

    # Criar transação financeira
    transaction = FinancialTransaction(
        tenant_id=tenant_id,
        show_id=show_id,
        type=type,
        category=category,
        description=description,
        budgeted_amount=budgeted_amount,
        realized_amount=realized_amount,
        receipt_url=receipt_url,
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)

    # Verificar budget overflow
    budget_overflow = False
    if budgeted_amount > 0 and realized_amount > budgeted_amount:
        budget_overflow = True

    return {
        "id": str(transaction.id),
        "show_id": str(show_id),
        "type": type.value,
        "category": category.value,
        "budgeted_amount": str(budgeted_amount),
        "realized_amount": str(realized_amount),
        "budget_overflow": budget_overflow,
        "message": "Custo lançado com sucesso." + (
            " ⚠️ ALERTA: Orçamento estourado!" if budget_overflow else ""
        ),
    }


@router.get("/")
async def list_logistics_costs(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> list[dict]:
    """Lista todos os lançamentos de custos do show."""
    stmt = select(FinancialTransaction).where(
        FinancialTransaction.show_id == show_id,
        FinancialTransaction.tenant_id == tenant_id,
    )
    result = await db.execute(stmt)
    transactions = result.scalars().all()

    return [
        {
            "id": str(t.id),
            "type": t.type.value,
            "category": t.category.value,
            "description": t.description,
            "budgeted_amount": str(t.budgeted_amount),
            "realized_amount": str(t.realized_amount),
            "budget_overflow": t.budget_overflow,
            "receipt_url": t.receipt_url,
        }
        for t in transactions
    ]
