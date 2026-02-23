"""
Manager Show — Router: Contracts (Client — Módulo 2: Contratos e Trava de Segurança)

Gerencia contratos do show:
- Geração de minuta
- Upload de documento assinado
- Validação do contrato (TRAVA MESTRA que libera Etapa 3)

REGRA DA BÍBLIA (Regra 02 — TRAVA MESTRA):
Apenas um usuário com permissão can_approve_contracts pode chamar
o endpoint POST /shows/{id}/contracts/validate para setar
contract_validated = True no Show.
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.permissions import require_permissions
from app.exceptions import ShowNotFoundException
from app.models.contract import Contract, ContractStatus
from app.models.show import Show, ShowStatus
from app.models.user import User

router = APIRouter(prefix="/shows/{show_id}/contracts", tags=["Client — Contratos"])


@router.post("/", status_code=201)
async def create_contract(
    show_id: uuid.UUID,
    title: str,
    content: str | None = None,
    db: DbSession = None,
    tenant_id: TenantId = None,
) -> dict:
    """Cria uma minuta de contrato para o show."""
    # Verificar se o show existe e pertence ao tenant
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    contract = Contract(
        tenant_id=tenant_id,
        show_id=show_id,
        title=title,
        content=content,
        status=ContractStatus.DRAFT,
    )
    db.add(contract)

    # Atualizar status do show para CONTRATO_PENDENTE
    if show.status.value in ("SONDAGEM", "PROPOSTA"):
        show.status = ShowStatus.CONTRATO_PENDENTE

    await db.flush()
    await db.refresh(contract)

    return {
        "id": str(contract.id),
        "show_id": str(show_id),
        "title": contract.title,
        "status": contract.status.value,
        "message": "Minuta criada com sucesso.",
    }


@router.get("/")
async def list_contracts(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> list[dict]:
    """Lista contratos de um show."""
    stmt = select(Contract).where(
        Contract.show_id == show_id,
        Contract.tenant_id == tenant_id,
    )
    result = await db.execute(stmt)
    contracts = result.scalars().all()

    return [
        {
            "id": str(c.id),
            "title": c.title,
            "status": c.status.value,
            "file_url": c.file_url,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        }
        for c in contracts
    ]


@router.post("/validate", status_code=200)
async def validate_contract(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: User = Depends(require_permissions("can_approve_contracts")),
) -> dict:
    """
    TRAVA MESTRA — Valida o contrato e libera a Etapa 3.

    Apenas usuários com permissão can_approve_contracts podem executar.
    Seta contract_validated = True no Show, destravando o lançamento
    de despesas e logística.
    """
    tenant_id = current_user.tenant_id

    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise ShowNotFoundException(show_id)

    show.contract_validated = True
    show.contract_validated_at = datetime.now(timezone.utc)
    show.contract_validated_by = current_user.id
    show.status = ShowStatus.ASSINADO

    await db.flush()

    return {
        "show_id": str(show_id),
        "contract_validated": True,
        "validated_by": current_user.name,
        "validated_at": show.contract_validated_at.isoformat(),
        "message": "Contrato validado! Etapa 3 (Pré-Produção/Logística) desbloqueada.",
    }
