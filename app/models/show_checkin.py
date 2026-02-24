"""
Manager Show — Model: ShowCheckin (Check-in de Presença — Etapa 5)

Registra a presença da equipe no show (Fechamento de Estrada).
A conclusão do check-in libera a consolidação do DRE (Etapa 6).

Suporta dados offline-sync: os IDs chegam em batch do app mobile.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


class ShowCheckin(TenantMixin, Base):
    """
    Registro individual de presença no show.

    Cada registro vincula um user_id (membro da equipe) a um show_id.
    Quando todos os check-ins são realizados, o gerente pode fechar
    a estrada (road_closed = True no Show).
    """

    __tablename__ = "show_checkins"

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
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        comment="Membro da equipe que fez check-in",
    )
    checked_in_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Data/hora do check-in",
    )

    # --- Relacionamentos ---
    show: Mapped["Show"] = relationship(  # noqa: F821
        back_populates="checkin_users",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return f"<ShowCheckin(show_id={self.show_id}, user_id={self.user_id})>"
