"""
Manager Show — Model: SaaS Lead (CRM Interno da Retaguarda)

Leads de prospecção do SaaS — escritórios/produtoras
que ainda não são clientes (Tenants).
"""

import enum
import uuid

from sqlalchemy import Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin

class SaaSLeadStatus(str, enum.Enum):
    NOVO = "NOVO"
    CONTATADO = "CONTATADO"
    QUALIFICADO = "QUALIFICADO"
    PROPOSTA = "PROPOSTA"
    CONVERTIDO = "CONVERTIDO"
    PERDIDO = "PERDIDO"

class SaaSLead(TimestampMixin, Base):
    __tablename__ = "saas_leads"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    contact_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    document: Mapped[str | None] = mapped_column(String(20), nullable=True)
    status: Mapped[SaaSLeadStatus] = mapped_column(
        Enum(SaaSLeadStatus, name="saas_lead_status_enum"),
        default=SaaSLeadStatus.NOVO,
        nullable=False,
    )
    source: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<SaaSLead(company='{self.company_name}', status={self.status.value})>"
