"""
Manager Show — Model: Tenant (Escritório/Produtora)

O Tenant é a entidade raiz do Multi-Tenancy. Cada escritório/produtora
é um tenant isolado no sistema. A tabela Tenants NÃO herda TenantMixin
pois ela própria é a referência de tenancy.
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, Integer, String, ForeignKey
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
        comment="Antigo identificador (CPF/CNPJ)",
    )
    cnpj: Mapped[str | None] = mapped_column(
        String(20),
        unique=True,
        nullable=True,
        comment="CNPJ oficial da agência",
    )
    address: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )
    cep: Mapped[str | None] = mapped_column(String(10), nullable=True)
    street: Mapped[str | None] = mapped_column(String(255), nullable=True)
    number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    complement: Mapped[str | None] = mapped_column(String(255), nullable=True)
    neighborhood: Mapped[str | None] = mapped_column(String(255), nullable=True)
    city: Mapped[str | None] = mapped_column(String(255), nullable=True)
    state: Mapped[str | None] = mapped_column(String(2), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    contact_phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    status: Mapped[TenantStatus] = mapped_column(
        Enum(TenantStatus, name="tenant_status"),
        default=TenantStatus.TRIAL,
        nullable=False,
    )
    account_type: Mapped[str] = mapped_column(
        String(50),
        default="ARTIST",
        nullable=False,
        comment="Perfil do tenant: ARTIST ou AGENCY",
    )
    plan_type: Mapped[str] = mapped_column(
        String(50),
        default="Essencial",
        nullable=False,
        comment="Nível do plano (Essencial, Pro, Enterprise)",
    )
    plan_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("saas_bundles.id"),
        nullable=True,
    )
    enabled_modules: Mapped[list[str]] = mapped_column(
        JSONB,
        default=list,
        nullable=False,
    )
    feature_toggles: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
        comment="Toggles de recursos (JSONB)",
    )
    users_limit: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
        comment="Limite de usuários na plataforma",
    )
    storage_limit_gb: Mapped[int] = mapped_column(
        Integer,
        default=10,
        nullable=False,
        comment="Limite total de armazenamento no Minio S3 em GB",
    )
    whatsapp_limit: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Limite de instâncias permitidas na Evolution API",
    )
    is_suspended: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Kill Switch: Se True, bloqueia acesso",
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    is_onboarded: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Indica se o tenant completou o wizard inicial",
    )
    subscription_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    # --- Relacionamentos ---
    plan: Mapped["SaaS_Bundle"] = relationship("SaaS_Bundle", back_populates="tenants")
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


