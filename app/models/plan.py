"""
Manager Show — Model: Plan (Planos SaaS)

Define os pacotes de recursos e limites para os clientes.
"""

import uuid
from sqlalchemy import String, Numeric, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin

class Plan(TimestampMixin, Base):
    """
    Planos de Assinatura do SaaS.
    Define o que está incluso no pacote base.
    """
    __tablename__ = "plans"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0)
    max_users: Mapped[int] = mapped_column(default=5)
    is_active: Mapped[bool] = mapped_column(default=True)
    
    # Recursos inclusos no plano. Ex: ["whatsapp", "kanban", "reports"]
    features: Mapped[list[str]] = mapped_column(JSONB, default=list, nullable=False)

    # Relacionamento com Tenants
    tenants: Mapped[list["Tenant"]] = relationship(
        back_populates="plan",
        lazy="raise"
    )

    def __repr__(self) -> str:
        return f"<Plan(name='{self.name}', price={self.price})>"
