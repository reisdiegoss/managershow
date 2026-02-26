"""
Manager Show — Model: ShowExecutionMedia (Comprovação Fiscal)

Armazena as evidências (fotos e vídeos) de que o show realmente aconteceu.
Essencial para o mercado de Prefeituras, onde o pagamento exige prova de execução.
"""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin


class ShowExecutionMedia(TenantMixin, Base):
    """
    Galeria de comprovação de execução do show.
    """

    __tablename__ = "show_execution_media"

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
    media_url: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        comment="URL da mídia no S3",
    )
    media_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="MIME type (image/jpeg, video/mp4, etc.)",
    )
    filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # --- Relacionamentos ---
    show: Mapped["Show"] = relationship(  # noqa: F821
        back_populates="execution_media",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return f"<ShowExecutionMedia(id={self.id}, show_id={self.show_id}, file={self.filename})>"
