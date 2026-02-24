"""
Manager Show — Model: ContractorNote (Notas do Perfil 360)

Timeline de observações e histórico comercial de um contratante.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.contractor import Contractor
    from app.models.user import User


class ContractorNote(TenantMixin, TimestampMixin, Base):
    """
    Notas de histórico de um contratante.
    """

    __tablename__ = "contractor_notes"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    contractor_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("contractors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="O conteúdo da nota comercial",
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Usuário que registrou a nota",
    )

    # --- Relacionamentos ---
    contractor: Mapped["Contractor"] = relationship(
        back_populates="notes_list",
        lazy="raise",
    )
    author: Mapped["User | None"] = relationship(
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<ContractorNote(id={self.id}, contractor_id={self.contractor_id})>"
