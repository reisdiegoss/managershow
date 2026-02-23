"""
Manager Show — Routers: Retaguarda (Super Admin)

Agrupa os sub-routers do namespace /api/v1/retaguarda:
- /tenants — CRUD de agências/escritórios
- /webhooks — Webhooks do Asaas (pagamentos)
- /crm — Funil de leads do SaaS
- /tickets — Help Desk / Suporte

Acesso restrito à equipe interna (Super Admin).
"""

from fastapi import APIRouter

from app.routers.retaguarda.tenants import router as tenants_router
from app.routers.retaguarda.webhooks import router as webhooks_router
from app.routers.retaguarda.crm import router as crm_router
from app.routers.retaguarda.tickets import router as tickets_router

router = APIRouter(prefix="/api/v1/retaguarda", tags=["Retaguarda"])

router.include_router(tenants_router)
router.include_router(webhooks_router)
router.include_router(crm_router)
router.include_router(tickets_router)
