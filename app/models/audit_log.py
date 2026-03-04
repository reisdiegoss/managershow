"""
Manager Show — Model: Audit Log (Retaguarda)

Registra ações críticas do SuperAdmin para auditoria.
"""

import uuid
from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    admin_id: Mapped[str] = mapped_column(String(255), nullable=False, comment="ID do Clerk do Admin")
    action: Mapped[str] = mapped_column(String(255), nullable=False, comment="Ex: 'ALTER_TENANT_LIMITS'")
    target_id: Mapped[str | None] = mapped_column(String(255), nullable=True, comment="ID do alvo (ex: tenant_id)")
    details: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False, comment="Dados da alteração")

    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action='{self.action}', admin='{self.admin_id}')>"
