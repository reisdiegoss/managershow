"""
Manager Show — Model: CommercialLead (CRM de Vendas do Tenant)

Diferente do modelo Lead (SaaS), este é focado na prospecção de shows
pelos vendedores do escritório para seus contratantes.
"""

import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.seller import Seller
    from app.models.contractor import Contractor


class CommercialLeadStatus(str, enum.Enum):
    """Estágios do funil de vendas do CRM."""
    PROSPECÇÃO = "PROSPECÇÃO"
    CONTATO = "CONTATO"
    NEGOCIAÇÃO = "NEGOCIAÇÃO"
    GANHO = "GANHO"
    PERDIDO = "PERDIDO"


class CommercialLead(TenantMixin, TimestampMixin, Base):
    """
    Lead comercial (Sondagem/Oportunidade de Show).
    """

    __tablename__ = "commercial_leads"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    contractor_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do contratante (pode não estar cadastrado ainda)",
    )
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("contractors.id", ondelete="SET NULL"),
        nullable=True,
    )
    city: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    target_date: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        comment="Data pretendida (string livre ou formatada)",
    )
    estimated_budget: Mapped[float | None] = mapped_column(
        Numeric(14, 2),
        nullable=True,
        comment="Orçamento previsto do cliente",
    )
    status: Mapped[CommercialLeadStatus] = mapped_column(
        Enum(CommercialLeadStatus, name="commercial_lead_status"),
        default=CommercialLeadStatus.PROSPECÇÃO,
        nullable=False,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    seller_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("sellers.id", ondelete="SET NULL"),
        nullable=True,
    )

    # --- Relacionamentos ---
    seller: Mapped["Seller | None"] = relationship(
        back_populates="leads",
        lazy="select",
    )
    contractor: Mapped["Contractor | None"] = relationship(
        lazy="select",
    )

    def __repr__(self) -> str:
        return f"<CommercialLead(id={self.id}, contractor='{self.contractor_name}', status={self.status.value})>"
