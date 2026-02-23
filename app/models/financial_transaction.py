"""
Manager Show — Model: FinancialTransaction (Livro-Razão do Show)

O Ledger financeiro do show. Registra todas as transações: receitas,
custos de produção, custos de colocação, impostos e comissões.

REGRA DA BÍBLIA:
- Custo de Produção: Equipe, Backline, LED, Carregadores, Efeitos
- Custo de Colocação: Passagens, Ônibus, Transfer, Hospedagem, Diárias
- NUNCA usar Float para dinheiro — sempre Numeric(14, 2)

REGRA DO SPECS.md:
- budgeted_amount: Valor previsto (Etapa 1/3)
- realized_amount: Valor real pago
- O Pydantic gera flag budget_overflow se realized > budgeted
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class TransactionType(str, enum.Enum):
    """Classificação macro da transação financeira."""
    REVENUE = "REVENUE"                 # Receita (cachê)
    PRODUCTION_COST = "PRODUCTION_COST" # Custo de Produção
    LOGISTICS_COST = "LOGISTICS_COST"   # Custo de Colocação (Logística)
    TAX = "TAX"                         # Impostos
    COMMISSION = "COMMISSION"           # Comissões
    KICKBACK = "KICKBACK"               # Retorno/Produção (Prefeituras)
    EXTRA_EXPENSE = "EXTRA_EXPENSE"     # Despesas extras (Etapa 5 - Estrada)


class TransactionCategory(str, enum.Enum):
    """
    Categorização detalhada de custos.

    Produção:
    - CREW_PAYMENT: Folha de músicos/equipe
    - BACKLINE: Locação de instrumentos/equipamentos
    - SOUND_LIGHT: Som e iluminação
    - STAGE: Palco, LED, carregadores, efeitos

    Colocação (Logística):
    - FLIGHT: Passagens aéreas
    - BUS: Ônibus/fretamento
    - HOTEL: Hospedagem
    - VAN_TRANSFER: Van/Transfer local
    - MEALS: Alimentação/diárias

    Outros:
    - TAX_NF: Imposto sobre Nota Fiscal
    - INTERMEDIARY: Comissão de intermediário
    - OTHER: Outros custos não categorizados
    """
    # Produção
    CREW_PAYMENT = "CREW_PAYMENT"
    BACKLINE = "BACKLINE"
    SOUND_LIGHT = "SOUND_LIGHT"
    STAGE = "STAGE"

    # Colocação (Logística)
    FLIGHT = "FLIGHT"
    BUS = "BUS"
    HOTEL = "HOTEL"
    VAN_TRANSFER = "VAN_TRANSFER"
    MEALS = "MEALS"

    # Impostos e comissões
    TAX_NF = "TAX_NF"
    INTERMEDIARY = "INTERMEDIARY"

    # Outros
    OTHER = "OTHER"


class FinancialTransaction(TenantMixin, TimestampMixin, Base):
    """
    Livro-razão (Ledger) do show.

    Cada lançamento registra o valor orçado (previsto) e o valor
    realizado (pago), permitindo o comparativo Orçado vs. Realizado
    e a flag de budget_overflow quando realizado > orçado.
    """

    __tablename__ = "financial_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    show_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("shows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Show ao qual esta transação pertence",
    )
    type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType, name="transaction_type"),
        nullable=False,
        comment="Tipo macro da transação (Receita, Custo de Produção, etc.)",
    )
    category: Mapped[TransactionCategory] = mapped_column(
        Enum(TransactionCategory, name="transaction_category"),
        nullable=False,
        comment="Categoria detalhada do custo",
    )
    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Descrição livre do lançamento",
    )
    budgeted_amount: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
        comment="Valor orçado/previsto (definido na Etapa 1 ou 3)",
    )
    realized_amount: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
        comment="Valor real pago/executado",
    )
    receipt_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL do comprovante/nota fiscal (upload via S3 no app mobile)",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # --- Relacionamentos ---
    show: Mapped["Show"] = relationship(  # noqa: F821
        back_populates="financial_transactions",
    )

    @property
    def budget_overflow(self) -> bool:
        """
        Flag de alerta: True se o valor realizado ultrapassou o orçado.

        Calculado em tempo real — não é armazenado no banco.
        """
        if self.budgeted_amount and self.budgeted_amount > 0:
            return self.realized_amount > self.budgeted_amount
        return False

    def __repr__(self) -> str:
        return (
            f"<FinancialTransaction(id={self.id}, show_id={self.show_id}, "
            f"type={self.type.value}, realized={self.realized_amount})>"
        )
