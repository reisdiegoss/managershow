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

# Cache das chaves JWKS do Clerk (evita buscar a cada request)
_jwks_cache: dict | None = None


async def _get_jwks(settings: Settings) -> dict:
    """
    Busca as chaves JWKS do Clerk para validação do JWT.

    Faz cache em memória para evitar latência de rede a cada request.
    Em produção, considere TTL de 1 hora.
    """
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.clerk_jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


def _is_dev_mode(settings: Settings) -> bool:
    """Verifica se estamos em modo desenvolvimento (placeholder do Clerk)."""
    return settings.clerk_secret_key.startswith("sk_test_PLACEHOLDER")


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    authorization: str | None = Header(None, alias="Authorization"),
    x_dev_user_id: str | None = Header(None, alias="X-Dev-User-Id"),
) -> User:
    """
    Dependência principal de autenticação do FastAPI.

    Uso nos endpoints:
        async def meu_endpoint(
            current_user: User = Depends(get_current_user)
        ):

    Em DESENVOLVIMENTO (Clerk com placeholder):
        - Aceita header X-Dev-User-Id com o UUID do usuário mockado
        - Permite testar no Swagger sem token real do Clerk

    Em PRODUÇÃO:
        - Exige header Authorization: Bearer <jwt_token>
        - Valida JWT via JWKS do Clerk
        - Busca User no banco pelo clerk_id extraído do token
    """

    # --- Modo Desenvolvimento: bypass com X-Dev-User-Id ---
    if _is_dev_mode(settings) and x_dev_user_id:
        return await _get_user_by_id(db, uuid.UUID(x_dev_user_id))

    # --- Modo Produção: validação JWT do Clerk ---
    if not authorization or not authorization.startswith("Bearer "):
        raise InvalidTokenException()

    token = authorization.removeprefix("Bearer ").strip()

    try:
        # Buscar chaves JWKS do Clerk
        jwks = await _get_jwks(settings)

        # Extrair header do JWT para identificar a chave correta
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        # Encontrar a chave correspondente ao kid
        rsa_key: dict = {}
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                rsa_key = key
                break

        if not rsa_key:
            raise InvalidTokenException()

        # Decodificar e validar o JWT
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            options={"verify_aud": False},  # Clerk não usa audience padrão
        )

        clerk_id: str | None = payload.get("sub")
        if not clerk_id:
            raise InvalidTokenException()

    except JWTError:
        raise InvalidTokenException()

    # Buscar usuário pelo clerk_id
    return await _get_user_by_clerk_id(db, clerk_id)


async def _get_user_by_clerk_id(db: AsyncSession, clerk_id: str) -> User:
    """Busca o User no banco pelo clerk_id do Clerk."""
    stmt = (
        select(User)
        .options(selectinload(User.role), selectinload(User.tenant))
        .where(User.clerk_id == clerk_id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado no sistema. Solicite acesso ao administrador.",
        )

    _validate_user_access(user)
    return user


async def _get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> User:
    """Busca o User no banco pelo ID interno (modo dev)."""
    stmt = (
        select(User)
        .options(selectinload(User.role), selectinload(User.tenant))
        .where(User.id == user_id)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=404,
            detail=f"Usuário com ID {user_id} não encontrado (modo dev).",
        )

    _validate_user_access(user)
    return user


def _validate_user_access(user: User) -> None:
    """Valida se o usuário e seu tenant estão aptos a acessar a API."""
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="Sua conta está desativada. Contate o administrador.",
        )

    if user.tenant and user.tenant.status == TenantStatus.SUSPENDED:
        raise TenantSuspendedException()
