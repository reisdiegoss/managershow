"""
Manager Show — Model: Contractor (Contratante)

O contratante é quem está pagando pelo show: pode ser uma empresa
privada, um promoter, uma prefeitura, etc.

Suporta cadastro "On-The-Fly" — pode ser criado inline durante
a criação de um show via objeto aninhado no request.
"""

import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class Contractor(TenantMixin, TimestampMixin, Base):
    """
    Contratante do show (promoter, prefeitura, empresa).

    Pode ser reutilizado em múltiplos shows. Campos
    opcionais para permitir cadastro rápido on-the-fly.
    """

    __tablename__ = "contractors"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do contratante (pessoa física ou jurídica)",
    )
    document: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="CNPJ ou CPF do contratante",
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    city: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Cidade do contratante",
    )
    uf: Mapped[str | None] = mapped_column(
        String(2),
        nullable=True,
        comment="UF do contratante",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # --- Relacionamentos ---
    shows: Mapped[list["Show"]] = relationship(  # noqa: F821
        back_populates="contractor",
        lazy="raise",
    )
    notes_list: Mapped[list["ContractorNote"]] = relationship(
        back_populates="contractor",
        cascade="all, delete-orphan",
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<Contractor(id={self.id}, name='{self.name}')>"
