import uuid
from datetime import datetime
from sqlalchemy import String, Numeric, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class SaaSPaymentLog(Base):
    """
    Log de auditoria para todos os eventos recebidos via Webhook do Asaas.
    Permite rastrear pagamentos, erros e tentativas de fraude de forma global.
    """
    __tablename__ = "saas_payment_logs"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # Ex: PAYMENT_CONFIRMED
    payment_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # ID no Asaas
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(PG_UUID(as_uuid=True), nullable=True, index=True)
    amount: Mapped[float | None] = mapped_column(Numeric(14, 2), nullable=True)
    
    # Payload original para depuração histórica
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self) -> str:
        return f"<SaaSPaymentLog(event={self.event_type}, payment={self.payment_id})>"
