"""
Manager Show — Model: Tenant (Escritório/Agência)

O Tenant é a entidade raiz do Multi-Tenancy. Cada escritório/agência
é um tenant isolado no sistema. A tabela Tenants NÃO herda TenantMixin
pois ela própria é a referência de tenancy.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class TenantStatus(str, enum.Enum):
    """Status da assinatura do tenant no SaaS."""
    ACTIVE = "ACTIVE"           # Assinatura em dia
    SUSPENDED = "SUSPENDED"     # Pagamento vencido — acesso à API bloqueado
    TRIAL = "TRIAL"             # Período de teste gratuito


class Tenant(TimestampMixin, Base):
    """
    Escritório/Agência — raiz do Multi-Tenancy.

    Gerenciado exclusivamente pela Retaguarda (Super Admin).
    Cada tenant possui seus próprios usuários, artistas e shows.
    """

    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do escritório/agência",
    )
    document: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="CNPJ ou CPF do escritório",
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="E-mail principal de contato",
    )
    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="Telefone de contato",
    )
    status: Mapped[TenantStatus] = mapped_column(
        Enum(TenantStatus, name="tenant_status"),
        default=TenantStatus.TRIAL,
        nullable=False,
        comment="Status da assinatura SaaS",
    )
    max_users: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
        comment="Limite máximo de usuários permitidos no plano",
    )
    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data de vencimento da assinatura (renovada a cada pagamento)",
    )

    # --- Relacionamentos ---
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    roles: Mapped[list["Role"]] = relationship(  # noqa: F821
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    artists: Mapped[list["Artist"]] = relationship(  # noqa: F821
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, name='{self.name}', status={self.status.value})>"


