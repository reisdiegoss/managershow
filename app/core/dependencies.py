"""
Manager Show — Dependências Reutilizáveis do FastAPI

Centraliza dependências comuns usadas em múltiplos routers:
- get_db: sessão de banco de dados
- get_redis: cliente Redis
- get_current_user: usuário autenticado
- get_current_tenant_id: tenant_id do usuário logado
"""

import uuid
from typing import Annotated

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.database import get_db as _get_db
from app.models.user import User
from app.redis import get_redis as _get_redis

# Type aliases para uso direto nos endpoints — mais limpo e legível
DbSession = Annotated[AsyncSession, Depends(_get_db)]
RedisClient = Annotated[Redis, Depends(_get_redis)]
CurrentUser = Annotated[User, Depends(get_current_user)]


async def get_current_tenant_id(
    current_user: CurrentUser,
) -> uuid.UUID:
    """
    Extrai o tenant_id do usuário logado.

    REGRA DA ARCHITECTURE.md: Toda query DEVE incluir tenant_id
    nos filtros para garantir isolamento absoluto entre clientes.

    Uso no endpoint:
        async def listar_shows(
            tenant_id: uuid.UUID = Depends(get_current_tenant_id)
        ):
    """
    return current_user.tenant_id


TenantId = Annotated[uuid.UUID, Depends(get_current_tenant_id)]
