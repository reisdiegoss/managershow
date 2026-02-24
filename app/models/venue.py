"""
Manager Show — Model: Venue (Local do Show)

Casa de show, arena, espaço de eventos, etc.
Suporta cadastro "On-The-Fly" durante criação do show.
"""

import uuid

from sqlalchemy import Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class Venue(TenantMixin, TimestampMixin, Base):
    """
    Local/Casa de show.

    Registra endereço, capacidade e dados de contato.
    Reutilizável em múltiplos shows.
    """

    __tablename__ = "venues"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do local (ex: Arena Castelão, Bar do Zé)",
    )
    city: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    uf: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
    )
    address: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Endereço completo",
    )
    capacity: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        comment="Capacidade de público",
    )
    contact_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    contact_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # --- Relacionamentos ---
    shows: Mapped[list["Show"]] = relationship(  # noqa: F821
        back_populates="venue",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return f"<Venue(id={self.id}, name='{self.name}', city='{self.city}')>"
