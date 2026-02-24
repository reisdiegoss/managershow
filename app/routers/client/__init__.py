"""
Manager Show — Routers: Client (O Manager Show)

Agrupa os sub-routers do namespace /api/v1/client:
- /shows — Agenda, vendas e simulador de viabilidade
- /shows/{id}/contracts — Contratos e trava de segurança
- /shows/{id}/logistics — Pré-produção e logística
- /shows/{id}/daysheet — Roteiro / Day Sheet
- /shows/{id}/road-closing — Fechamento de estrada
- /shows/{id}/dre — Borderô e DRE automático

Todos os endpoints filtram obrigatoriamente pelo tenant_id
do usuário logado via Clerk.
"""

from fastapi import APIRouter

from app.routers.client.shows import router as shows_router
from app.routers.client.contracts import router as contracts_router
from app.routers.client.logistics import router as logistics_router
from app.routers.client.daysheet import router as daysheet_router
from app.routers.client.road_closing import router as road_closing_router
from app.routers.client.dre import router as dre_router
from app.routers.client.artists import router as artists_router
from app.routers.client.contractors import router as contractors_router
from app.routers.client.venues import router as venues_router
from app.routers.client.documents import router as documents_router
from app.routers.client.leads import router as leads_router
from app.routers.client.sellers import router as sellers_router

router = APIRouter(prefix="/api/v1/client", tags=["Client"])

router.include_router(shows_router)
router.include_router(contracts_router)
router.include_router(logistics_router)
router.include_router(daysheet_router)
router.include_router(road_closing_router)
router.include_router(dre_router)
router.include_router(artists_router)
router.include_router(contractors_router)
router.include_router(venues_router)
router.include_router(documents_router)
router.include_router(leads_router)
router.include_router(sellers_router)
