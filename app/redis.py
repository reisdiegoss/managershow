"""
Manager Show — Conexão com Redis

Usado para:
- Cache de sessões e dados temporários
- Rate limiting
- Broker do Celery (filas de background)
"""

from redis.asyncio import Redis, from_url

from app.config import get_settings

settings = get_settings()

# Cliente Redis assíncrono — reutilizado em toda a aplicação
redis_client: Redis = from_url(
    settings.redis_url,
    decode_responses=True,  # Retorna strings ao invés de bytes
)


async def get_redis() -> Redis:
    """
    Dependência do FastAPI para injetar o cliente Redis.

    Uso no endpoint:
        async def meu_endpoint(redis: Redis = Depends(get_redis)):
    """
    return redis_client
