"""
Manager Show — Conexão Assíncrona com PostgreSQL (SQLAlchemy 2.0)

Configura o engine assíncrono (asyncpg) e a fábrica de sessões.
Toda operação de I/O com o banco DEVE usar await.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import get_settings

settings = get_settings()

# Engine assíncrono — pool de conexões com PostgreSQL via asyncpg
engine = create_async_engine(
    settings.database_url,
    echo=settings.is_development,  # Loga SQL apenas em dev
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,  # Verifica conexão antes de usar (evita conexões mortas)
)

# Fábrica de sessões assíncronas — cada request recebe uma sessão isolada
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Permite acessar atributos após commit sem novo SELECT
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependência do FastAPI que fornece uma sessão de banco por request.

    Uso no endpoint:
        async def meu_endpoint(db: AsyncSession = Depends(get_db)):

    A sessão é fechada automaticamente ao final do request (finally).
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
