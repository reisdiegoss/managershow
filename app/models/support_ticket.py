"""
Manager Show — Model: Support Ticket (Helpdesk)

Gerencia chamados de suporte técnico abertos pelos tenants.
"""

import enum
import uuid
from sqlalchemy import Enum, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

class TicketStatus(str, enum.Enum):
    ABERTO = "Aberto"
    ANDAMENTO = "Andamento"
    RESOLVIDO = "Resolvido"

class TicketPriority(str, enum.Enum):
    BAIXA = "Baixa"
    MEDIA = "Media"
    ALTA = "Alta"
    URGENTE = "Urgente"

class SupportTicket(TimestampMixin, Base):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="support_ticket_status"),
        default=TicketStatus.ABERTO,
        nullable=False,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        Enum(TicketPriority, name="support_ticket_priority"),
        default=TicketPriority.MEDIA,
        nullable=False,
    )

    # Relacionamento
    tenant = relationship("Tenant", lazy="select")

    def __repr__(self) -> str:
        return f"<SupportTicket(id={self.id}, subject='{self.subject}', status={self.status.value})>"
