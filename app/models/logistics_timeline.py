"""
Manager Show — Model: LogisticsTimeline (Day Sheet / Roteiro)

O Day Sheet é a timeline logística do show: horários, deslocamentos,
check-in no hotel, passagem de som, show, etc.

Quando o roteiro é concluído, uma tarefa Celery/Redis envia
notificações push para a equipe.
"""

import uuid

from sqlalchemy import ForeignKey, String, Text, Time, Numeric
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class LogisticsTimeline(TenantMixin, TimestampMixin, Base):
    """
    Item da timeline do Day Sheet.

    Cada registro é um ponto no roteiro do show com horário,
    descrição e detalhes logísticos.
    """

    __tablename__ = "logistics_timeline"

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
    time: Mapped[str] = mapped_column(
        Time,
        nullable=False,
        comment="Horário do item na timeline (ex: 14:00)",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Título do item (ex: Chegada no Aeroporto, Passagem de Som)",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Detalhes adicionais (endereço, contato, observações)",
    )
    icon_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Tipo de ícone para o frontend (flight, hotel, soundcheck, show, etc.)",
    )
    order: Mapped[int] = mapped_column(
        default=0,
        nullable=False,
        comment="Ordem de exibição na timeline",
    )

    # --- Integrações Inteligentes (Fase 27) ---
    weather_temp: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        comment="Temperatura prevista para o local/horário",
    )
    weather_condition: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Condição climática (ex: Céu Limpo, Chuva Moderada)",
    )
    route_distance: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Distância estimada (Google Maps)",
    )
    route_duration: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Tempo estimado de percurso (Google Maps)",
    )
    location_place_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Google Place ID para precisão de localização",
    )

    # --- Relacionamentos ---
    show: Mapped["Show"] = relationship(  # noqa: F821
        back_populates="logistics_timeline",
        lazy="raise",
    )

    def __repr__(self) -> str:
        return f"<LogisticsTimeline(id={self.id}, time={self.time}, title='{self.title}')>"
