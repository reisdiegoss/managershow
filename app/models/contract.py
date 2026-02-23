"""
Manager Show — Model: Contract (Contratos)

Gerencia a minuta do contrato e o upload de documentos assinados.

A validação do contrato (contract_validated no Show) é a TRAVA MESTRA
que libera a Etapa 3 (Pré-Produção/Logística).
"""

import enum
import uuid

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class ContractStatus(str, enum.Enum):
    """Status do contrato."""
    DRAFT = "DRAFT"           # Rascunho / Minuta gerada
    SENT = "SENT"             # Enviado para assinatura
    SIGNED = "SIGNED"         # Assinado pelo contratante
    CANCELLED = "CANCELLED"   # Cancelado


class Contract(TenantMixin, TimestampMixin, Base):
    """
    Contrato do show.

    Pode haver múltiplos contratos por show (minutas, aditivos).
    O fluxo de validação (SIGNED) é o que aciona a flag
    contract_validated no Show, destravando a Etapa 3.
    """

    __tablename__ = "contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    show_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("shows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[ContractStatus] = mapped_column(
        Enum(ContractStatus, name="contract_status"),
        default=ContractStatus.DRAFT,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Título do contrato (ex: Minuta Principal, Aditivo 01)",
    )
    content: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Conteúdo/corpo da minuta em texto (para geração PDF futura)",
    )
    file_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="URL do documento assinado (upload manual ou assinatura digital)",
    )
    signed_by: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Nome de quem assinou o contrato",
    )

    # --- Relacionamentos ---
    show: Mapped["Show"] = relationship(  # noqa: F821
        back_populates="contracts",
    )

    def __repr__(self) -> str:
        return f"<Contract(id={self.id}, show_id={self.show_id}, status={self.status.value})>"
