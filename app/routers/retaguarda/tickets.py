"""
Manager Show — Router: Tickets / Help Desk (Retaguarda)

Endpoints para receber, listar e responder chamados de suporte
abertos pelos usuários das agências.

ESQUELETO — será expandido conforme necessidade.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/tickets", tags=["Retaguarda — Tickets"])


@router.get("/")
async def list_tickets() -> dict:
    """Lista todos os tickets de suporte."""
    # TODO: Implementar service/repository
    return {"message": "Endpoint de listagem de tickets — em construção"}


@router.post("/")
async def create_ticket() -> dict:
    """Cria um novo ticket de suporte."""
    # TODO: Implementar service/repository
    return {"message": "Endpoint de criação de ticket — em construção"}


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str) -> dict:
    """Busca um ticket específico."""
    # TODO: Implementar service/repository
    return {"message": f"Endpoint de detalhe do ticket {ticket_id} — em construção"}


@router.post("/{ticket_id}/reply")
async def reply_ticket(ticket_id: str) -> dict:
    """Responde a um ticket de suporte."""
    # TODO: Implementar service/repository
    return {"message": f"Endpoint de resposta ao ticket {ticket_id} — em construção"}
