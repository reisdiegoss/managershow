import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TenantMixin

class ShowCrew(Base, TenantMixin):
    """
    Relacionamento entre Show e ArtistCrew para um evento específico.
    Rastreia se o membro da equipe visualizou o roteiro (Read Receipt).
    """
    __tablename__ = "show_crews"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    show_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    crew_member_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("artist_crews.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Smart Share / Read Receipt
    read_receipt: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relacionamentos
    show: Mapped["Show"] = relationship("Show", back_populates="crew_assignments") # noqa: F821
    crew_member: Mapped["ArtistCrew"] = relationship("ArtistCrew") # noqa: F821

    def __repr__(self) -> str:
        return f"<ShowCrew(show_id={self.show_id}, crew_member_id={self.crew_member_id}, read={self.read_receipt})>"
