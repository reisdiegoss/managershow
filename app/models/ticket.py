"""
Manager Show — Model: Ticket (Help Desk — Retaguarda)

Chamados de suporte abertos por usuários das produtoras.

Fluxo: ABERTO → EM_ATENDIMENTO → RESOLVIDO / FECHADO
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class TicketStatus(str, enum.Enum):
    """Status do ticket de suporte."""
    ABERTO = "ABERTO"
    EM_ATENDIMENTO = "EM_ATENDIMENTO"
    RESOLVIDO = "RESOLVIDO"
    FECHADO = "FECHADO"


class TicketPriority(str, enum.Enum):
    """Prioridade do ticket."""
    BAIXA = "BAIXA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    URGENTE = "URGENTE"


class Ticket(TimestampMixin, Base):
    """
    Ticket de suporte do Help Desk.

    Vinculado a um Tenant (produtora que abriu o chamado)
    e opcionalmente a um User (quem abriu).
    """

    __tablename__ = "tickets"

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
        comment="Produtora que abriu o chamado",
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Usuário que abriu o chamado",
    )
    subject: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Assunto do chamado",
    )
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Descrição detalhada do problema",
    )
    status: Mapped[TicketStatus] = mapped_column(
        Enum(TicketStatus, name="ticket_status"),
        default=TicketStatus.ABERTO,
        nullable=False,
    )
    priority: Mapped[TicketPriority] = mapped_column(
        Enum(TicketPriority, name="ticket_priority"),
        default=TicketPriority.MEDIA,
        nullable=False,
    )
    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Categoria (Financeiro, Técnico, Sugestão, etc.)",
    )

    # --- Relacionamentos ---
    tenant: Mapped["Tenant"] = relationship()  # noqa: F821

    def __repr__(self) -> str:
        return f"<Ticket(id={self.id}, subject='{self.subject}', status={self.status.value})>"


class TicketReply(TimestampMixin, Base):
    """Resposta/mensagem de um ticket de suporte."""

    __tablename__ = "ticket_replies"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    ticket_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    author_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do autor da resposta (equipe ou cliente)",
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Conteúdo da resposta",
    )
    is_internal: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        comment="Se True, resposta interna da equipe (não visível para o cliente)",
    )

    # --- Relacionamentos ---
    ticket: Mapped["Ticket"] = relationship()

    def __repr__(self) -> str:
        return f"<TicketReply(ticket_id={self.ticket_id}, author='{self.author_name}')>"
