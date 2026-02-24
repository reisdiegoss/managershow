"""
Manager Show — Model: Commission (Comissões)

Gerencia as comissões de intermediários, vendedores e do escritório.

REGRA CRÍTICA DA BÍBLIA:
- Comissão sobre BRUTO: Calculada sobre o Valor de Face (GROSS)
  → Geralmente para vendedores externos e intermediários
- Comissão sobre LÍQUIDO: Calculada sobre o Resultado Final / Liquidez (NET)
  → Geralmente para a agência e sócios
  → Só pode ser calculada APÓS abater todos custos, impostos e comissões brutas
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class CommissionBase(str, enum.Enum):
    """Base de cálculo da comissão."""
    GROSS = "GROSS"  # Sobre o Valor Bruto (Valor de Face)
    NET = "NET"      # Sobre o Lucro Líquido (Liquidez Real)


class Commission(TenantMixin, TimestampMixin, Base):
    """
    Registro de comissão vinculada a um show.

    Pode ser comissão de vendedor, intermediário, sócio ou do escritório.
    O DRE calcula o valor efetivo em tempo real com base no percentage
    e na commission_base (GROSS ou NET).
    """

    __tablename__ = "commissions"

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
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Usuário do sistema que recebe a comissão (se interno)",
    )
    beneficiary_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do beneficiário (pode ser externo, não-usuário)",
    )
    commission_base: Mapped[CommissionBase] = mapped_column(
        Enum(CommissionBase, name="commission_base"),
        nullable=False,
        comment="Base de cálculo: GROSS (sobre bruto) ou NET (sobre líquido)",
    )
    percentage: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        comment="Percentual da comissão (ex: 10.00 para 10%)",
    )

    # --- Relacionamentos ---
    show: Mapped["Show"] = relationship(  # noqa: F821
        back_populates="commissions",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return (
            f"<Commission(id={self.id}, beneficiary='{self.beneficiary_name}', "
            f"base={self.commission_base.value}, pct={self.percentage}%)>"
        )
