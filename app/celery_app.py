"""
Manager Show — Celery App Config
"""

import os
from celery import Celery
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration

# URL do Redis carregada do ambiente ou default
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Configuração de Observabilidade (Sentry)
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[CeleryIntegration()],
        environment=os.getenv("APP_ENV", "development"),
        traces_sample_rate=1.0,
    )

celery_app = Celery(
    "manager_show",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.tasks.notifications"]
)

# Configurações adicionais
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
)

if __name__ == "__main__":
    celery_app.start()
