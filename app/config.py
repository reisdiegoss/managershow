"""
Manager Show — Configuração Central (Pydantic Settings)

Todas as variáveis de ambiente são carregadas e validadas aqui.
O Pydantic Settings garante type-safety e valores padrão seguros.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações globais da aplicação Manager Show."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # --- Aplicação ---
    app_env: str = "development"
    app_debug: bool = False
    app_title: str = "Manager Show API"
    app_version: str = "0.1.0"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # --- Banco de Dados PostgreSQL (async via asyncpg) ---
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/managershow"

    # --- Redis (Cache, Sessões, Broker do Celery) ---
    redis_url: str = "redis://localhost:6379/0"

    # --- Observabilidade (Sentry) ---
    sentry_dsn: str = ""

    # --- Clerk (Autenticação JWT) ---
    clerk_secret_key: str = "sk_test_PLACEHOLDER"
    clerk_jwks_url: str = "https://seu-app.clerk.accounts.dev/.well-known/jwks.json"
    clerk_issuer: str = "https://seu-app.clerk.accounts.dev"

    # --- Asaas (Webhook de pagamento SaaS) ---
    asaas_webhook_token: str = "PLACEHOLDER"

    # --- Storage (Uploads - S3/Minio) ---
    s3_access_key: str = "GPjZNQo7LOptvjXePfUI"
    s3_secret_key: str = "FMsPlo7UN9NqKkLbFksmxQm5g5i8eu3BRXfaouCy"
    s3_bucket: str = "ManagerShow"
    s3_endpoint: str = "https://s3.vimasistemas.com.br"
    s3_region: str = "eu-south"
    s3_use_ssl: bool = True

    # --- APIs Externas (Fase 27) ---
    google_maps_api_key: str = ""
    openweather_api_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        """Retorna as origens CORS como lista de strings."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        """Verifica se estamos em ambiente de desenvolvimento."""
        return self.app_env == "development"

    @property
    def database_url_sync(self) -> str:
        """URL síncrona do banco (usada pelo Alembic e scripts de seed)."""
        return self.database_url.replace("postgresql+asyncpg", "postgresql+psycopg2")


@lru_cache
def get_settings() -> Settings:
    """Singleton cacheado das configurações. Evita reler o .env a cada request."""
    return Settings()
