import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, Numeric, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING
from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.tenant import Tenant

class AddonType(str, enum.Enum):
    STORAGE = "STORAGE"
    USERS = "USERS"
    WHATSAPP = "WHATSAPP"

class SaaS_Bundle(TimestampMixin, Base):
    """
    Planos Base / Atalhos de assinatura do Manager Show.
    Representam o ponto de partida do cliente.
    """
    __tablename__ = "saas_bundles"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    add_users: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    add_storage_gb: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    add_whatsapp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relacionamento com Tenants
    tenants: Mapped[list["Tenant"]] = relationship(
        "Tenant",
        back_populates="plan",
        lazy="raise"
    )

    def __repr__(self) -> str:
        return f"<SaaS_Bundle(name='{self.name}', price={self.price})>"

class SaaS_Addon(TimestampMixin, Base):
    """
    Produtos individuais da 'Lojinha' avulsa.
    Permitem expansão modular dos recursos do Tenant.
    """
    __tablename__ = "saas_addons"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    addon_type: Mapped[AddonType] = mapped_column(
        Enum(AddonType, name="addon_type_enum"),
        nullable=False
    )
    quantity_added: Mapped[int] = mapped_column(Integer, nullable=False, comment="Quanto de recurso este addon libera")

    def __repr__(self) -> str:
        return f"<SaaS_Addon(name='{self.name}', type={self.addon_type.value}, qty={self.quantity_added})>"

class Tenant_Subscription_Log(TimestampMixin, Base):
    """
    Registro inalterável de compras feitas pelo Tenant (Logs de Auditoria Financeira).
    """
    __tablename__ = "tenant_subscription_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    bundle_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("saas_bundles.id", ondelete="SET NULL"),
        nullable=True,
    )
    addon_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("saas_addons.id", ondelete="SET NULL"),
        nullable=True,
    )
    amount_paid: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    logged_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        default=datetime.utcnow,
        nullable=False
    )

    # Relacionamentos (Opcionais se quiser navegar)
    # tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="subscription_logs")
    bundle: Mapped["SaaS_Bundle"] = relationship("SaaS_Bundle")
    addon: Mapped["SaaS_Addon"] = relationship("SaaS_Addon")

    def __repr__(self) -> str:
        return f"<SubscriptionLog(tenant_id={self.tenant_id}, amount={self.amount_paid})>"
