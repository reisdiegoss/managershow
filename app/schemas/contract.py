"""
Manager Show — Schemas: Contract (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.contract import ContractStatus


class ContractCreate(BaseModel):
    """Schema de criação de contrato."""
    title: str = Field(..., min_length=2, max_length=255)
    content: str | None = None
    file_url: str | None = Field(None, max_length=500)


class ContractUpdate(BaseModel):
    """Schema de atualização parcial de contrato."""
    title: str | None = Field(None, min_length=2, max_length=255)
    content: str | None = None
    file_url: str | None = None
    status: ContractStatus | None = None
    signed_by: str | None = None


class ContractResponse(BaseModel):
    """Schema de resposta do contrato."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    show_id: UUID
    title: str
    status: ContractStatus
    content: str | None
    file_url: str | None
    signed_by: str | None
    created_at: datetime
    updated_at: datetime


class AvailabilityDeclarationRequest(BaseModel):
    """Schema para solicitação de Declaração de Disponibilidade."""
    requesting_company_name: str  # Ex: GOLDEN EVENTOS
    requesting_company_cnpj: str  # Ex: 52.565.013/0001-01
    show_date: str  # Ex: 08/05/2026
    event_name: str  # Ex: 25ª Festa Nacional da Maçã


class CommercialProposalRequest(BaseModel):
    """Schema para solicitação de Carta Proposta Comercial (Desmembramento para Prefeitura)."""
    cache_artistico: float
    cache_producao: float
    logistica_nacional: float
    logistica_local_vans: float
    hospedagens: float
    diarias_alimentacao: float
    rider_camarim: float
    efeitos: float
    nota_fiscal_impostos: float
    total_amount: float
    payment_conditions: str  # Ex: Parcela única até dia 20...
