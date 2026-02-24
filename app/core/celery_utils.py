"""
Manager Show — Core: Celery Utils (Async/Sync Bridge)
"""

import asyncio
import functools
from typing import Any, Callable

def async_to_sync(func: Callable[..., Any]) -> Callable[..., Any]:
    """
    Decorator que permite rodar funções assíncronas (FastAPI/SQLAlchemy)
    dentro de contextos síncronos (Workers do Celery).
    
    Uso:
        @celery_app.task
        @async_to_sync
        async def minha_task_async():
            # código async aqui
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        return asyncio.run(func(*args, **kwargs))
    return wrapper
