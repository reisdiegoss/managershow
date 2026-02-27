"""
Manager Show — Model: Lead (CRM Interno da Retaguarda)

Leads de prospecção do SaaS — escritórios/produtoras
que ainda não são clientes (Tenants).

Funil de vendas: NOVO → CONTATADO → QUALIFICADO → PROPOSTA → CONVERTIDO / PERDIDO
"""

import enum
import uuid

from sqlalchemy import Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class LeadStatus(str, enum.Enum):
    """Estágio do lead no funil de vendas."""
    NOVO = "NOVO"
    CONTATADO = "CONTATADO"
    QUALIFICADO = "QUALIFICADO"
    PROPOSTA = "PROPOSTA"
    CONVERTIDO = "CONVERTIDO"
    PERDIDO = "PERDIDO"


class Lead(TimestampMixin, Base):
    """
    Lead do CRM interno — prospecção de novos escritórios/produtoras.

    NÃO possui tenant_id pois é gerido pela Retaguarda (Super Admin).
    Quando convertido, um Tenant é criado a partir dos dados do Lead.
    """

    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    company_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do escritório/produtora prospectado",
    )
    contact_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome do contato principal",
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )
    document: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        comment="CNPJ ou CPF",
    )
    status: Mapped[LeadStatus] = mapped_column(
        Enum(LeadStatus, name="lead_status"),
        default=LeadStatus.NOVO,
        nullable=False,
    )
    source: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
        comment="Origem do lead (Site, Indicação, Instagram, etc.)",
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Observações sobre o lead",
    )

    def __repr__(self) -> str:
        return f"<Lead(company='{self.company_name}', status={self.status.value})>"
