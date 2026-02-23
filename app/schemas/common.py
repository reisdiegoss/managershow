"""
Manager Show — Schemas Comuns (Respostas Padronizadas, Paginação)

Define o formato padrão de respostas da API conforme o GUIA TÉCNICO:
{
    "error": "string_code",
    "message": "Mensagem clara em PT-BR",
    "details": []
}

E o formato de paginação para listagens.
"""

from datetime import datetime
from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


# =============================================================================
# Respostas Padronizadas
# =============================================================================


class ErrorResponse(BaseModel):
    """Formato padrão de erro da API (GUIA TÉCNICO)."""
    error: str
    message: str
    details: list[Any] = []


class SuccessResponse(BaseModel):
    """Resposta de sucesso genérica."""
    message: str
    data: Any = None


# =============================================================================
# Paginação
# =============================================================================


class PaginationParams(BaseModel):
    """Parâmetros de paginação para requests de listagem."""
    page: int = 1
    page_size: int = 20

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginatedResponse(BaseModel, Generic[T]):
    """Resposta paginada genérica para listagens."""
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int


# =============================================================================
# Schema Base com ID e Timestamps (para responses)
# =============================================================================


class BaseSchema(BaseModel):
    """Schema base com configuração Pydantic V2."""
    model_config = ConfigDict(from_attributes=True)


class TimestampSchema(BaseSchema):
    """Schema com campos de auditoria temporal."""
    created_at: datetime
    updated_at: datetime


class BaseResponseSchema(TimestampSchema):
    """Schema base para responses com ID + timestamps."""
    id: UUID
