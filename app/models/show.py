"""
Manager Show — Model: Show (O Centro da Arquitetura)

Tabela principal do sistema. Todas as demais tabelas dependem dela.
O Show passa por uma máquina de estados finitos (6 etapas) onde
uma etapa só destrava se a anterior for validada.

REGRAS DA BÍBLIA DO PRODUTO:
- Regra 01: Não alterar negotiation_type após contrato gerado
- Regra 02 (TRAVA MESTRA): Bloquear Etapa 3 se contract_validated == False
- Regra 03: DRE só consolida após check-in da equipe (Etapa 5)

REGRA DO GUIA TÉCNICO:
- Valores monetários usam Numeric(14, 2) — NUNCA Float
"""

import enum
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class ShowStatus(str, enum.Enum):
    """
    Máquina de estados do Show — reflete as 6 etapas da esteira.

    SONDAGEM → PROPOSTA → CONTRATO_PENDENTE → ASSINADO →
    PRE_PRODUCAO → EM_ESTRADA → CONCLUIDO
    """
    SONDAGEM = "SONDAGEM"                     # Etapa 1 — Prospecção
    PROPOSTA = "PROPOSTA"                      # Etapa 1 — Proposta enviada
    CONTRATO_PENDENTE = "CONTRATO_PENDENTE"    # Etapa 2 — Aguardando assinatura
    ASSINADO = "ASSINADO"                      # Etapa 2 — Contrato validado (destrava Etapa 3)
    PRE_PRODUCAO = "PRE_PRODUCAO"              # Etapa 3 — Compras e logística
    EM_ESTRADA = "EM_ESTRADA"                  # Etapa 4/5 — Day Sheet gerado, equipe em campo
    CONCLUIDO = "CONCLUIDO"                    # Etapa 6 — DRE disponível


class ClientType(str, enum.Enum):
    """Tipo de contratante — altera completamente a matemática do DRE."""
    PRIVATE = "PRIVATE"    # Mercado privado — contratos rápidos
    PUBLIC = "PUBLIC"      # Prefeituras — burocracia documental, Nota de Empenho


class NegotiationType(str, enum.Enum):
    """
    Filtros de Negociação — define quem paga o quê.

    REGRA DA BÍBLIA:
    - CACHE_MAIS_DESPESAS: Contratante paga banda + compra todas passagens/hotéis
    - COLOCADO_TOTAL: Contratante paga valor cheio, produtora assume 100% logística
    - CACHE_MAIS_AEREO: Produtora banca aéreo até destino, contratante banca hotel+van local
    - PERSONALIZADO: Regra customizada (campo custom_negotiation_notes)
    """
    CACHE_MAIS_DESPESAS = "CACHE_MAIS_DESPESAS"
    COLOCADO_TOTAL = "COLOCADO_TOTAL"
    CACHE_MAIS_AEREO = "CACHE_MAIS_AEREO"
    PERSONALIZADO = "PERSONALIZADO"


class Show(TenantMixin, TimestampMixin, Base):
    """
    Show/Evento — entidade central da esteira de produção.

    Todas as transações financeiras, contratos, logística, Day Sheet
    e fechamento de DRE estão vinculados a um Show.
    """

    __tablename__ = "shows"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # --- Referências ---
    artist_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("artists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Artista que se apresenta neste show",
    )
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("contractors.id", ondelete="SET NULL"),
        nullable=True,
        comment="Contratante do show (pode ser cadastrado on-the-fly)",
    )
    venue_id: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("venues.id", ondelete="SET NULL"),
        nullable=True,
        comment="Local/Casa de Show (pode ser cadastrado on-the-fly)",
    )

    # --- Status e Classificação ---
    status: Mapped[ShowStatus] = mapped_column(
        Enum(ShowStatus, name="show_status"),
        default=ShowStatus.SONDAGEM,
        nullable=False,
        index=True,
        comment="Etapa atual na esteira de produção",
    )
    client_type: Mapped[ClientType] = mapped_column(
        Enum(ClientType, name="client_type"),
        nullable=False,
        comment="Tipo de show: PRIVATE ou PUBLIC (Prefeitura)",
    )
    negotiation_type: Mapped[NegotiationType] = mapped_column(
        Enum(NegotiationType, name="negotiation_type"),
        nullable=False,
        comment="Filtro de negociação: define quem paga o quê",
    )
    custom_negotiation_notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Notas adicionais quando negotiation_type == PERSONALIZADO",
    )

    # --- Data e Local ---
    date_show: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        comment="Data do show",
    )
    date_end: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        comment="Data de término (para temporadas/festivais multi-dia)",
    )
    location_city: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Cidade do show",
    )
    location_uf: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
        comment="UF (estado) do show",
    )
    location_venue_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        comment="Nome do local/casa de show (texto livre)",
    )

    # --- Valores Financeiros (SEMPRE Numeric, NUNCA Float) ---
    base_price: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        comment="Valor de Face (Nota) — para Prefeituras é o valor público",
    )
    real_cache: Mapped[float] = mapped_column(
        Numeric(14, 2),
        nullable=False,
        comment="Cachê Real — receita efetiva da produtora",
    )
    production_kickback: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
        comment="Retorno de Produção (Prefeitura) — NUNCA contabilizar como lucro no DRE",
    )
    tax_percentage: Mapped[float] = mapped_column(
        Numeric(5, 2),
        default=0,
        nullable=False,
        comment="Percentual de imposto sobre a Nota Fiscal",
    )
    logistics_budget_limit: Mapped[float] = mapped_column(
        Numeric(14, 2),
        default=0,
        nullable=False,
        comment="Limite de Budget Logístico (Simulador BI)",
    )

    # --- Travas de Segurança ---
    contract_validated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="TRAVA MESTRA: Se False, bloqueia Etapa 3 (Pré-Produção/Logística)",
    )
    contract_validated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data/hora da validação do contrato",
    )
    contract_validated_by: Mapped[uuid.UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        comment="Usuário que validou o contrato",
    )

    # --- Checkin / Road Closing (Etapa 5) ---
    road_closed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Se True, check-in da equipe realizado — libera consolidação do DRE",
    )
    road_closed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        comment="Data/hora do fechamento de estrada",
    )

    # --- Observações ---
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Observações gerais sobre o show",
    )

    # --- Relacionamentos (lazy="raise" previne MissingGreenlet async) ---
    artist: Mapped["Artist"] = relationship(  # noqa: F821
        back_populates="shows",
        lazy="raise",
    )
    contractor: Mapped["Contractor | None"] = relationship(  # noqa: F821
        back_populates="shows",
        lazy="raise",
    )
    venue: Mapped["Venue | None"] = relationship(  # noqa: F821
        back_populates="shows",
        lazy="raise",
    )
    financial_transactions: Mapped[list["FinancialTransaction"]] = relationship(  # noqa: F821
        back_populates="show",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    execution_media: Mapped[list["ShowExecutionMedia"]] = relationship(  # noqa: F821
        back_populates="show",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    commissions: Mapped[list["Commission"]] = relationship(  # noqa: F821
        back_populates="show",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    contracts: Mapped[list["Contract"]] = relationship(  # noqa: F821
        back_populates="show",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    logistics_timeline: Mapped[list["LogisticsTimeline"]] = relationship(  # noqa: F821
        back_populates="show",
        cascade="all, delete-orphan",
        lazy="raise",
    )
    checkin_users: Mapped[list["ShowCheckin"]] = relationship( # noqa: F821
        back_populates="show",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    crew_assignments: Mapped[list["ShowCrew"]] = relationship( # noqa: F821
        "ShowCrew",
        back_populates="show",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    # --- Constantes de Hierarquia de Status ---
    BLOCKED_FOR_COSTS = {
        ShowStatus.SONDAGEM,
        ShowStatus.PROPOSTA,
        ShowStatus.CONTRATO_PENDENTE,
    }

    def can_add_costs(self) -> bool:
        """
        TRAVA MESTRA (Regra 02): Verifica se o show pode receber lançamentos.

        Retorna True se o show já passou da fase de contrato.
        Usa hierarquia de status Enum — não apenas o boolean contract_validated.
        Assim, shows em PRE_PRODUCAO, EM_ESTRADA ou CONCLUIDO continuam
        permitindo lançamentos (ex: despesas extras na Etapa 5).
        """
        return self.status not in self.BLOCKED_FOR_COSTS

    def can_close_road(self) -> bool:
        """Verifica se o show pode ser fechado (road closing)."""
        return self.status in {ShowStatus.EM_ESTRADA}

    def __repr__(self) -> str:
        return (
            f"<Show(id={self.id}, artist_id={self.artist_id}, "
            f"city='{self.location_city}', status={self.status.value})>"
        )
