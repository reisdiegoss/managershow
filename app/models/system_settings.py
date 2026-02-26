import uuid
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class SystemSettings(Base):
    """
    Configurações globais do SaaS (Acesso exclusivo da Retaguarda/Superadmin).
    Não utiliza TenantMixin.
    """
    __tablename__ = "system_settings"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    evolution_api_url: Mapped[str] = mapped_column(String(255), nullable=True)
    evolution_api_key: Mapped[str] = mapped_column(String(255), nullable=True)
    evolution_instance_name: Mapped[str] = mapped_column(String(100), nullable=True)
    is_whatsapp_active: Mapped[bool] = mapped_column(Boolean, default=False)
