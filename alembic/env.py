"""
Manager Show — Alembic env.py (Configuração de Migrações)

Importa todos os models via app.models.__init__ para que o
Alembic detecte automaticamente as tabelas ao gerar migrações
com --autogenerate.
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.config import get_settings
from app.models import Base  # Importa Base e TODOS os models registrados

# Ler configuração do alembic.ini
config = context.config

# Configurar logging do Alembic
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata do SQLAlchemy — usada pelo autogenerate
target_metadata = Base.metadata

# Sobrescrever a URL do banco com a URL do .env (síncrona)
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url_sync)


def run_migrations_offline() -> None:
    """Executa migrações em modo 'offline' (gera SQL sem conectar)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Executa migrações em modo 'online' (conecta ao banco)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
