"""
Manager Show — Schemas: Auth (Pydantic V2)

Schemas para endpoints de autenticação e informações do usuário logado.
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TokenPayload(BaseModel):
    """Payload do JWT do Clerk decodificado."""
    sub: str  # clerk_id
    iss: str  # issuer


class CurrentUserResponse(BaseModel):
    """Resposta do endpoint /me com dados completos do usuário logado."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    tenant_name: str
    clerk_id: str
    email: str
    name: str
    role_name: str | None
    permissions: dict | None
    is_active: bool
