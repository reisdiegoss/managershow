"""
Manager Show — Model: CityBaseCost (Histórico de Custos por Cidade)

Base de dados histórica para alimentar o Simulador de Viabilidade.

O endpoint GET /shows/simulate faz uma query AVG() sobre estes registros
para projetar custos médios de voo e hotel para uma cidade nos últimos
12 meses, retornando o status VIABLE ou RISKY com a margem projetada.
"""

import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin


class CityBaseCost(TenantMixin, TimestampMixin, Base):
    """
    Custo médio de logística para uma cidade específica.

    Alimentado automaticamente a partir dos custos realizados
    dos shows anteriores. Serve como base para o Simulador de
    Viabilidade projetar custos futuros.
    """

    __tablename__ = "city_base_costs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    show_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("shows.id", ondelete="SET NULL"),
        nullable=True,
        comment="Show de origem deste registro de custo (se aplicável)",
    )
    city: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Cidade de destino",
    )
    uf: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
        comment="UF da cidade",
    )
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Categoria do custo (FLIGHT, HOTEL, VAN_TRANSFER, etc.)",
    )
    cost_amount: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        comment="Valor do custo registrado",
    )
    reference_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Data de referência do custo (para filtro de últimos 12 meses)",
    )

    def __repr__(self) -> str:
        return (
            f"<CityBaseCost(city='{self.city}', category='{self.category}', "
            f"cost={self.cost_amount})>"
        )
