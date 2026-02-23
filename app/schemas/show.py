"""
Manager Show — Schemas: Show (Pydantic V2)

Schemas rigorosos para o Show com validação financeira.
REGRA: Valores monetários usam Decimal — validados pelo Pydantic.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.show import ClientType, NegotiationType, ShowStatus


# =============================================================================
# Cadastro On-The-Fly (objetos aninhados para criação inline)
# =============================================================================


class ContractorInline(BaseModel):
    """Contratante inline — cadastro on-the-fly durante criação do show."""
    name: str = Field(..., min_length=2, max_length=255)
    document: str | None = None
    email: str | None = None
    phone: str | None = None
    city: str | None = None
    uf: str | None = Field(None, max_length=2)


class VenueInline(BaseModel):
    """Local/Venue inline — cadastro on-the-fly durante criação do show."""
    name: str = Field(..., min_length=2, max_length=255)
    city: str = Field(..., max_length=255)
    uf: str = Field(..., max_length=2)
    address: str | None = None
    capacity: int | None = None


# =============================================================================
# Show Schemas
# =============================================================================


class ShowCreate(BaseModel):
    """
    Schema de criação de show.

    Suporta cadastro on-the-fly: se contractor_id ou venue_id não
    forem informados, o backend cria a entidade a partir dos objetos
    aninhados contractor/venue no mesmo request.
    """
    artist_id: UUID
    client_type: ClientType
    negotiation_type: NegotiationType
    custom_negotiation_notes: str | None = None

    # Data e local
    date_show: date
    date_end: date | None = None
    location_city: str = Field(..., max_length=255)
    location_uf: str = Field(..., max_length=2)
    location_venue_name: str | None = None

    # Valores financeiros (Decimal, NUNCA Float)
    base_price: Decimal = Field(..., ge=0, decimal_places=2, description="Valor de Face (Nota)")
    real_cache: Decimal = Field(..., ge=0, decimal_places=2, description="Cachê Real")
    production_kickback: Decimal = Field(Decimal("0"), ge=0, decimal_places=2)
    tax_percentage: Decimal = Field(Decimal("0"), ge=0, le=100, decimal_places=2)

    # Referências existentes (opcional se usar on-the-fly)
    contractor_id: UUID | None = None
    venue_id: UUID | None = None

    # Cadastro on-the-fly (objetos aninhados)
    contractor: ContractorInline | None = None
    venue: VenueInline | None = None

    # Observações
    notes: str | None = None

    @field_validator("real_cache")
    @classmethod
    def real_cache_must_not_exceed_base(cls, v: Decimal, info) -> Decimal:
        """
        REGRA DO SPECS.md: real_cache não pode ser maior que base_price.

        Para shows públicos, real_cache < base_price (a diferença é o
        production_kickback que NUNCA é lucro).
        """
        base = info.data.get("base_price")
        if base is not None and v > base:
            raise ValueError("O Cachê Real não pode ser maior que o Valor de Face (base_price).")
        return v


class ShowUpdate(BaseModel):
    """Schema de atualização parcial de show."""
    date_show: date | None = None
    date_end: date | None = None
    location_city: str | None = None
    location_uf: str | None = None
    location_venue_name: str | None = None
    base_price: Decimal | None = Field(None, ge=0, decimal_places=2)
    real_cache: Decimal | None = Field(None, ge=0, decimal_places=2)
    production_kickback: Decimal | None = Field(None, ge=0, decimal_places=2)
    tax_percentage: Decimal | None = Field(None, ge=0, le=100, decimal_places=2)
    notes: str | None = None
    contractor_id: UUID | None = None
    venue_id: UUID | None = None


class ShowResponse(BaseModel):
    """Schema de resposta do show."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    artist_id: UUID
    contractor_id: UUID | None
    venue_id: UUID | None
    status: ShowStatus
    client_type: ClientType
    negotiation_type: NegotiationType
    custom_negotiation_notes: str | None
    date_show: date
    date_end: date | None
    location_city: str
    location_uf: str
    location_venue_name: str | None
    base_price: Decimal
    real_cache: Decimal
    production_kickback: Decimal
    tax_percentage: Decimal
    contract_validated: bool
    contract_validated_at: datetime | None
    road_closed: bool
    road_closed_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


# =============================================================================
# Simulador de Viabilidade
# =============================================================================


class SimulateRequest(BaseModel):
    """
    Schema do Simulador de Viabilidade.

    O endpoint GET /shows/simulate recebe cidade, cachê e tipo
    de negociação para projetar um DRE provisório.
    """
    city: str = Field(..., description="Cidade destino do show")
    uf: str = Field(..., max_length=2, description="UF da cidade")
    cache: Decimal = Field(..., ge=0, description="Valor do cachê")
    negotiation_type: NegotiationType
    artist_id: UUID | None = Field(None, description="Artista (opcional, para filtrar histórico)")


class SimulateResponse(BaseModel):
    """
    Resposta do Simulador de Viabilidade.

    Retorna um DRE projetado baseado em médias de custos históricos
    para a cidade nos últimos 12 meses.
    """
    status: str = Field(..., description="VIABLE (Verde) ou RISKY (Vermelho)")
    projected_revenue: Decimal
    projected_flight_cost: Decimal
    projected_hotel_cost: Decimal
    projected_total_cost: Decimal
    projected_margin: Decimal
    margin_percentage: Decimal
    details: str | None = Field(None, description="Detalhes do cálculo")
