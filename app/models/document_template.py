"""
Manager Show — Model: DocumentTemplate (Motor de Documentos Dinâmico)

Cada tenant pode criar seus próprios templates HTML usando a sintaxe Jinja2.
Isso permite que propostas, contratos e declarações sejam 100% customizáveis.
"""

import enum
import uuid

from sqlalchemy import Enum, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TenantMixin, TimestampMixin


class DocumentEntityType(str, enum.Enum):
    """Define a qual entidade o template está vinculado (contexto de injeção)."""
    SHOW = "SHOW"
    ARTIST = "ARTIST"
    CONTRACTOR = "CONTRACTOR"


class DocumentTemplate(Base, TenantMixin, TimestampMixin):
    """
    Template de Documento Dinâmico.
    O campo content_html deve conter tags Jinja2 (ex: {{ show.artist.name }}).
    """
    __tablename__ = "document_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Ex: 'Proposta Comercial Atitude 67' ou 'Minuta Padrão'",
    )
    
    entity_type: Mapped[DocumentEntityType] = mapped_column(
        Enum(DocumentEntityType, name="document_entity_type"),
        nullable=False,
        comment="SHOW, ARTIST ou CONTRACTOR — define o objeto principal injetado",
    )
    
    content_html: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="O HTML com as variáveis Jinja2 para renderização",
    )

    def __repr__(self) -> str:
        return f"<DocumentTemplate(id={self.id}, name='{self.name}', type={self.entity_type.value})>"
