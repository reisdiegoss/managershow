"""
Manager Show — Base Declarativa + Mixins Reutilizáveis (SQLAlchemy 2.0)

Contém:
- Base: classe declarativa para todos os models
- TenantMixin: coluna tenant_id obrigatória em toda tabela multi-tenant
- TimestampMixin: colunas created_at/updated_at automáticas

REGRA DO GUIA TÉCNICO:
- Todas as colunas monetárias usam Numeric(14, 2) — NUNCA Float
- Estilo SQLAlchemy 2.0 com Mapped[] e mapped_column()
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    declared_attr,
    mapped_column,
)


class Base(DeclarativeBase):
    """Classe base declarativa para todos os models do SQLAlchemy 2.0."""
    pass


class TimestampMixin:
    """
    Mixin que adiciona colunas de auditoria temporal.

    Toda tabela do Manager Show deve herdar este mixin para
    rastreabilidade de criação e atualização de registros.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class TenantMixin:
    """
    Mixin Multi-Tenant obrigatório.

    REGRA DA ARCHITECTURE.md: Toda query no Backend DEVE incluir o
    tenant_id nos filtros para garantir isolamento absoluto de dados
    entre os clientes do SaaS.

    Tabelas que herdam este mixin recebem automaticamente:
    - tenant_id (UUID, FK para tenants.id, indexado, NOT NULL)
    """

    @declared_attr
    def tenant_id(cls) -> Mapped[uuid.UUID]:
        return mapped_column(
            PG_UUID(as_uuid=True),
            ForeignKey("tenants.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
