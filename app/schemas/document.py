"""
Manager Show — Schemas: Document (Motor de Documentos Dinâmico)
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.document_template import DocumentEntityType


class DocumentTemplateBase(BaseModel):
    """Base para templates de documentos."""
    name: str = Field(..., min_length=2, max_length=255)
    entity_type: DocumentEntityType
    content_html: str


class DocumentTemplateCreate(DocumentTemplateBase):
    """Schema para criação de template."""
    pass


class DocumentTemplateUpdate(BaseModel):
    """Schema para atualização parcial de template."""
    name: str | None = Field(None, min_length=2, max_length=255)
    entity_type: DocumentEntityType | None = None
    content_html: str | None = None


class DocumentTemplateResponse(DocumentTemplateBase):
    """Schema de resposta de template."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class DocumentGenerateRequest(BaseModel):
    """Schema para payload de geração dinâmica de PDF."""
    entity_id: uuid.UUID  # ID do Show, Artist ou Contractor
    custom_variables: dict[str, str] = Field(default_factory=dict)
