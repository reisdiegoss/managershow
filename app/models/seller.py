"""
Manager Show — Model: Seller (Vendedor)

Representa o vendedor (booker) responsável por leads e vendas.
Pode ser um usuário do sistema ou apenas um registro para relatórios
(ex: vendedores externos comissionados).
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.commercial_lead import CommercialLead


class Seller(TenantMixin, TimestampMixin, Base):
    """
    Vendedor do escritório (Booker).
    """

    __tablename__ = "sellers"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome completo do vendedor",
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="ID do usuário caso o vendedor use a plataforma",
    )

    # --- Relacionamentos ---
    user: Mapped["User | None"] = relationship(
        back_populates="seller_profile",
        lazy="select",
    )
    leads: Mapped[list["CommercialLead"]] = relationship(
        back_populates="seller",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return f"<Seller(id={self.id}, name='{self.name}')>"
