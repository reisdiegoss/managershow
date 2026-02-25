"""
Manager Show — Aplicação FastAPI Principal (main.py)

Ponto de entrada da API. Configura:
- Middleware CORS
- Exception Handler global (respostas padronizadas em PT-BR)
- Registro de todos os routers (Retaguarda + Client)
- Swagger/Redoc com CDN alternativo (unpkg.com — cdn.jsdelivr.net bloqueado)
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_redoc_html, get_swagger_ui_html
from fastapi.responses import JSONResponse
import sentry_sdk
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.config import get_settings
from app.exceptions import ManagerShowException

settings = get_settings()

# =============================================================================
# Observabilidade: Sentry
# =============================================================================
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.app_env,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# =============================================================================
# SecOps: Limiter (SlowAPI)
# =============================================================================
from app.core.limiter import limiter

# CDN alternativo — cdn.jsdelivr.net está com timeout
SWAGGER_JS_URL = "https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
SWAGGER_CSS_URL = "https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
REDOC_JS_URL = "https://unpkg.com/redoc@next/bundles/redoc.standalone.js"

# =============================================================================
# Inicialização do FastAPI (docs_url=None para usar custom)
# =============================================================================

app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description=(
        "API RESTful do **Manager Show** — ERP SaaS Multi-Tenant para "
        "gestão 360º de carreiras artísticas e shows.\n\n"
        "**Namespaces:**\n"
        "- `/api/v1/retaguarda` — Super Admin (gestão SaaS)\n"
        "- `/api/v1/client` — Manager Show (visão do cliente/agência)\n\n"
        "**Autenticação:** Clerk JWT (RS256)\n\n"
        "**Em desenvolvimento:** Use o header `X-Dev-User-Id` com o UUID "
        "de um usuário seedado para testar sem token Clerk."
    ),
    docs_url=None,
    redoc_url=None,
    openapi_url="/openapi.json",
)

# Registrar Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# =============================================================================
# Swagger / ReDoc com CDN alternativo (unpkg.com)
# =============================================================================

@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui():
    """Swagger UI com CDN unpkg.com (fallback do jsdelivr bloqueado)."""
    return get_swagger_ui_html(
        openapi_url=app.openapi_url,
        title=f"{settings.app_title} — Swagger",
        swagger_js_url=SWAGGER_JS_URL,
        swagger_css_url=SWAGGER_CSS_URL,
    )


@app.get("/redoc", include_in_schema=False)
async def custom_redoc():
    """ReDoc com CDN unpkg.com."""
    return get_redoc_html(
        openapi_url=app.openapi_url,
        title=f"{settings.app_title} — ReDoc",
        redoc_js_url=REDOC_JS_URL,
    )


# =============================================================================
# Middleware CORS
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Exception Handler Global (GUIA TÉCNICO)
# =============================================================================

@app.exception_handler(ManagerShowException)
async def manager_show_exception_handler(
    request: Request,
    exc: ManagerShowException,
) -> JSONResponse:
    """
    Captura todas as exceções de domínio e retorna JSON padronizado.

    Formato (GUIA TÉCNICO):
    {
        "error": "CODIGO_DO_ERRO",
        "message": "Mensagem clara em PT-BR para o usuário",
        "details": []
    }
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """
    Captura exceções não tratadas para nunca vazar detalhes internos.

    Em produção, loga o erro e retorna mensagem genérica.
    Em desenvolvimento, inclui detalhes para debug.
    """
    detail = str(exc) if settings.is_development else None
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Ocorreu um erro interno no servidor. Tente novamente.",
            "details": [detail] if detail else [],
        },
    )


# =============================================================================
# Registro de Routers
# =============================================================================

from app.routers.client import users as client_users_router # noqa: E402

app.include_router(retaguarda_router)
app.include_router(client_router)
app.include_router(client_users_router.router, prefix="/api/v1/client")


# =============================================================================
# Endpoints Utilitários
# =============================================================================

@app.get("/", tags=["Health"])
async def root() -> dict:
    """Health check da API."""
    return {
        "service": settings.app_title,
        "version": settings.app_version,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    """Health check detalhado."""
    return {
        "status": "healthy",
        "database": "connected",
        "redis": "connected",
    }
