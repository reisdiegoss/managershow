"""
Manager Show — Autenticação via Clerk JWT

Middleware/Dependência do FastAPI que:
1. Intercepta o JWT enviado no header Authorization
2. Busca as chaves JWKS do Clerk para validação
3. Decodifica e valida o token (issuer, expiração)
4. Extrai o clerk_id → busca o User no banco
5. Verifica se o Tenant está ativo (não suspenso)
6. Retorna o User completo com tenant_id para uso nos endpoints

Em desenvolvimento, se o CLERK_SECRET_KEY for placeholder,
aceita um header X-Dev-User-Id para facilitar testes no Swagger.
"""

import uuid
from typing import Annotated

import httpx
from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import Settings, get_settings
from app.database import get_db
from app.exceptions import InvalidTokenException, TenantSuspendedException
from app.models.tenant import TenantStatus
from app.models.user import User

# Cache das chaves JWKS do Clerk
import jwt as pyjwt # Usaremos PyJWT para o JWKClient que é mais robusto para Clerk
from jwt import PyJWKClient

class ClerkAuth:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.jwks_client = PyJWKClient(settings.clerk_jwks_url)

    async def validate_token(self, token: str) -> dict:
        """Valida o token RS256 usando as chaves públicas oficiais do Clerk."""
        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            payload = pyjwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=self.settings.clerk_issuer,
                options={"verify_aud": False}
            )
            return payload
        except Exception as e:
            raise InvalidTokenException()

async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    authorization: str | None = Header(None, alias="Authorization"),
    x_dev_user_id: str | None = Header(None, alias="X-Dev-User-Id"),
) -> User:
    """
    Dependência principal de autenticação do FastAPI.
    """

    # --- Modo Desenvolvimento: bypass com X-Dev-User-Id ---
    if settings.app_env == "development" and x_dev_user_id:
        try:
            return await _get_active_user_with_relations(db, user_id=uuid.UUID(x_dev_user_id))
        except ValueError:
            raise InvalidTokenException()

    # --- Modo Produção: validação JWT do Clerk ---
    if not authorization or not authorization.startswith("Bearer "):
        raise InvalidTokenException()

    token = authorization.removeprefix("Bearer ").strip()

    auth_service = ClerkAuth(settings)
    payload = await auth_service.validate_token(token)

    clerk_id: str | None = payload.get("sub")
    if not clerk_id:
        raise InvalidTokenException()

    # Buscar usuário pelo clerk_id
    return await _get_active_user_with_relations(db, clerk_id=clerk_id)


async def get_current_super_admin(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Dependência para rotas de Retaguarda.
    Verifica se o usuário pertence à Vima Sistemas ou tem role de Super Admin.
    """
    is_vima_email = current_user.email and current_user.email.endswith("@vimasistemas.com.br")
    # Role 'ADMIN' em um contexto global ou flag específica
    is_super_admin = current_user.role and current_user.role.name == "Super Admin Global"

    if not (is_vima_email or is_super_admin):
        raise HTTPException(
            status_code=403,
            detail="Acesso restrito à equipe de retaguarda do Manager Show.",
        )

    return current_user


async def _get_active_user_with_relations(
    db: AsyncSession, 
    clerk_id: str | None = None, 
    user_id: uuid.UUID | None = None
) -> User:
    """Busca o usuário com todos os relacionamentos necessários carregados."""
    stmt = (
        select(User)
        .options(
            selectinload(User.role),
            selectinload(User.tenant),
            selectinload(User.allowed_artists)
        )
    )
    
    if clerk_id:
        stmt = stmt.where(User.clerk_id == clerk_id)
    elif user_id:
        stmt = stmt.where(User.id == user_id)
    else:
        raise ValueError("clerk_id ou user_id deve ser fornecido.")

    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        detail = "Usuário não encontrado no sistema." if clerk_id else f"Usuário com ID {user_id} não encontrado."
        raise HTTPException(status_code=404, detail=detail)

    _validate_user_access(user)
    return user


def _validate_user_access(user: User) -> None:
    """Valida se o usuário e seu tenant estão aptos a acessar a API."""
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Sua conta está desativada. Contate o administrador.",
        )

    # Nota: User.tenant deve estar carregado (selectinload) na query original
    if user.tenant and user.tenant.status == TenantStatus.SUSPENDED:
        raise TenantSuspendedException()
