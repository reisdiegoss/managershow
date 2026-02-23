"""
Manager Show — Router: CRM Interno (Retaguarda)

Endpoints para gerenciar o funil de leads do SaaS.
Prospecção de novos escritórios/agências.

ESQUELETO — será expandido conforme necessidade.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/crm", tags=["Retaguarda — CRM"])


@router.get("/leads")
async def list_leads() -> dict:
    """Lista os leads do funil de prospecção."""
    # TODO: Implementar service/repository
    return {"message": "Endpoint de listagem de leads — em construção"}


@router.post("/leads")
async def create_lead() -> dict:
    """Cria um novo lead no funil."""
    # TODO: Implementar service/repository
    return {"message": "Endpoint de criação de lead — em construção"}
