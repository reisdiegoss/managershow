import uuid
from sqlalchemy import String, Boolean, Float, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

class TenantSettings(TimestampMixin, Base):
    """
    Configurações específicas da Produtora (Tenant).
    Criado no passo final do Wizard de Onboarding.
    """
    __tablename__ = "tenant_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    
    primary_color: Mapped[str | None] = mapped_column(String(7), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    require_visual_lock: Mapped[bool] = mapped_column(Boolean, default=True)
    default_agency_fee: Mapped[float] = mapped_column(Float, default=0.0)
    negotiation_setup: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relacionamento de volta para o Tenant
    tenant = relationship("Tenant")
