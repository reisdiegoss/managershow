"""
Manager Show — Model: Tenant (Escritório/Produtora)

O Tenant é a entidade raiz do Multi-Tenancy. Cada escritório/produtora
é um tenant isolado no sistema. A tabela Tenants NÃO herda TenantMixin
pois ela própria é a referência de tenancy.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.plan import Plan
    from app.models.user import User
    from app.models.role import Role
    from app.models.artist import Artist


class TenantStatus(str, enum.Enum):
    """Status da assinatura do tenant no SaaS."""
    ACTIVE = "ACTIVE"           # Assinatura em dia
    SUSPENDED = "SUSPENDED"     # Pagamento vencido — acesso à API bloqueado
    TRIAL = "TRIAL"             # Período de teste gratuito


class Tenant(TimestampMixin, Base):
    """
    Escritório/Produtora — raiz do Multi-Tenancy.

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
        comment="Nome do escritório/produtora",
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
    plan_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("plans.id"),
        nullable=True,
        comment="Plano de assinatura base",
    )
    enabled_modules: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
        comment="Módulos avulsos contratados (ex: ['whatsapp_pro'])",
    )
    max_users: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
        comment="Limite máximo de usuários (sobrescreve o do plano se definido)",
    )
    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data de vencimento da assinatura",
    )

    # --- Relacionamentos ---
    plan: Mapped["Plan"] = relationship("Plan", back_populates="tenants")
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


