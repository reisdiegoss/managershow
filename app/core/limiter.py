"""
Manager Show — SecOps: Limiter Utility
Configura o Throttling global e específico usando Redis.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import get_settings

settings = get_settings()

# Inicializa o Limiter usando Redis como backend de persistência
# Isso garante que o rate limit seja compartilhado entre múltiplos workers/instâncias da API.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.redis_url,
    default_limits=["100/minute"]
)
