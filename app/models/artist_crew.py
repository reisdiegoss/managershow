import uuid
from sqlalchemy import String, Numeric, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TenantMixin, TimestampMixin

class ArtistCrew(Base, TenantMixin, TimestampMixin):
    """
    Representa a equipe fixa (folha de pagamento) de um artista.
    Estes dados servem de base para o preenchimento automático
    do pré-show e fechamento de estrada.
    """
    __tablename__ = "artist_crews"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    artist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("artists.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False) # Ex: Técnico de Som, Roadie, Músico
    base_cache: Mapped[float] = mapped_column(Numeric(14, 2), default=0.00, comment="Valor padrão de cachê")
    base_diaria: Mapped[float] = mapped_column(Numeric(14, 2), default=0.00, comment="Valor padrão de diária")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relacionamento
    artist: Mapped["Artist"] = relationship("Artist", back_populates="crew_members") # noqa: F821

    def __repr__(self) -> str:
        return f"<ArtistCrew(name={self.name}, role={self.role})>"
