"""
Manager Show — Model: Artist (Artista)

Cada artista pertence a um Tenant (escritório/agência).
Um tenant pode gerenciar múltiplos artistas (Multi-Artista).
O artista é referenciado em todos os shows do sistema.
"""

import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class Artist(TenantMixin, TimestampMixin, Base):
    """
    Artista gerenciado por um escritório (tenant).

    Pode ser uma banda, cantor solo, dupla, etc.
    Relacionado a shows, contratos e comissões.
    """

    __tablename__ = "artists"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome artístico",
    )
    legal_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Razão social / Nome legal para contratos",
    )
    document: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="CNPJ ou CPF do artista/empresa",
    )
    genre: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Gênero musical principal (Sertanejo, Funk, etc.)",
    )
    bio: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Biografia resumida para contratos e propostas",
    )
    photo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL da foto principal do artista",
    )

    # --- Relacionamentos ---
    tenant: Mapped["Tenant"] = relationship(  # noqa: F821
        back_populates="artists",
        lazy="raise",
    )
    shows: Mapped[list["Show"]] = relationship(  # noqa: F821
        back_populates="artist",
        lazy="raise",
    )
    crew_members: Mapped[list["ArtistCrew"]] = relationship(  # noqa: F821
        "ArtistCrew",
        back_populates="artist",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return f"<Artist(id={self.id}, name='{self.name}')>"
