"""
Manager Show — Schemas: FinancialTransaction (Pydantic V2)

Schemas com validação Decimal estrita para transações financeiras.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.financial_transaction import TransactionCategory, TransactionType


class FinancialTransactionCreate(BaseModel):
    """Schema de criação de transação financeira (lançamento de custo)."""
    type: TransactionType
    category: TransactionCategory
    description: str | None = Field(None, max_length=500)
    budgeted_amount: Decimal = Field(Decimal("0"), ge=0, decimal_places=2)
    realized_amount: Decimal = Field(Decimal("0"), ge=0, decimal_places=2)
    receipt_url: str | None = Field(None, max_length=500)


class FinancialTransactionUpdate(BaseModel):
    """Schema de atualização parcial de transação."""
    description: str | None = None
    budgeted_amount: Decimal | None = Field(None, ge=0, decimal_places=2)
    realized_amount: Decimal | None = Field(None, ge=0, decimal_places=2)
    receipt_url: str | None = None


class FinancialTransactionResponse(BaseModel):
    """Schema de resposta da transação financeira."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    show_id: UUID
    type: TransactionType
    category: TransactionCategory
    description: str | None
    budgeted_amount: Decimal
    realized_amount: Decimal
    receipt_url: str | None
    created_at: datetime
    updated_at: datetime

    @property
    def budget_overflow(self) -> bool:
        if self.budgeted_amount and self.budgeted_amount > 0:
            return self.realized_amount > self.budgeted_amount
        return False
