"""
Manager Show — Router: Road Closing (Client — Módulo 5: Fechamento de Estrada)

Endpoints para:
- Check-in de presença da equipe (array de IDs offline-sync)
- Lançamento de despesas extras com upload de recibos
- Fechamento de estrada (road_closed = True)

Suporta dados offline-sync do app mobile PWA.
"""

import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel, Field
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession
from app.core.permissions import require_permissions
from app.exceptions import ShowNotFoundException
from app.models.financial_transaction import (
    FinancialTransaction,
    TransactionCategory,
    TransactionType,
)
from app.models.show import Show
from app.models.show_checkin import ShowCheckin
from app.models.user import User

router = APIRouter(prefix="/shows/{show_id}/road-closing", tags=["Client — Fechamento de Estrada"])


# =============================================================================
# Schemas Inline (específicos deste módulo)
# =============================================================================


class CheckinBatch(BaseModel):
    """Batch de check-in offline-sync."""
    user_ids: list[uuid.UUID] = Field(..., description="IDs dos usuários presentes no show")


class ExtraExpense(BaseModel):
    """Despesa extra não prevista."""
    description: str = Field(..., max_length=500)
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    category: TransactionCategory = TransactionCategory.OTHER
    receipt_url: str | None = None


# =============================================================================
# Endpoints
# =============================================================================


@router.post("/checkin", status_code=201)
async def batch_checkin(
    show_id: uuid.UUID,
    data: CheckinBatch,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    """
    Check-in em batch da equipe presente no show.

    Recebe array de IDs (offline-sync do PWA mobile).
    Cada ID gera um registro de presença.
    """
    tenant_id = current_user.tenant_id

    # Verificar show
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # Registrar check-in para cada usuário
    checked_count = 0
    for user_id in data.user_ids:
        # Verificar se já não fez check-in
        existing = await db.execute(
            select(ShowCheckin).where(
                ShowCheckin.show_id == show_id,
                ShowCheckin.user_id == user_id,
            )
        )
        if not existing.scalar_one_or_none():
            checkin = ShowCheckin(
                tenant_id=tenant_id,
                show_id=show_id,
                user_id=user_id,
            )
            db.add(checkin)
            checked_count += 1

    await db.flush()

    return {
        "show_id": str(show_id),
        "checked_in": checked_count,
        "already_checked": len(data.user_ids) - checked_count,
        "message": f"{checked_count} check-in(s) registrado(s) com sucesso.",
    }


@router.post("/extras", status_code=201)
async def add_extra_expense(
    show_id: uuid.UUID,
    db: DbSession,
    description: str = Form(...),
    amount: Decimal = Form(...),
    category: TransactionCategory = Form(TransactionCategory.OTHER),
    receipt_file: UploadFile = File(None),
    current_user: User = Depends(require_permissions("can_add_extra_expenses")),
) -> dict:
    """
    Lança uma despesa extra não prevista com UPLOAD de recibo (Etapa 5).
    """
    tenant_id = current_user.tenant_id
    from app.config import get_settings
    settings = get_settings()

    # Verificar show
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # TRAVA MESTRA — hierarquia de status
    if not show.can_add_costs():
        from app.exceptions import ContractNotSignedException
        raise ContractNotSignedException()

    # Processar Upload do Recibo via S3
    receipt_url = None
    if receipt_file:
        from app.services.s3_service import S3Service
        content = await receipt_file.read()
        receipt_url = await S3Service.upload_file(
            file_content=content,
            filename=receipt_file.filename,
            content_type=receipt_file.content_type
        )

    transaction = FinancialTransaction(
        tenant_id=tenant_id,
        show_id=show_id,
        type=TransactionType.EXTRA_EXPENSE,
        category=category,
        description=description,
        budgeted_amount=Decimal("0"),
        realized_amount=amount,
        receipt_url=receipt_url,
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)

    return {
        "id": str(transaction.id),
        "show_id": str(show_id),
        "description": description,
        "amount": str(amount),
        "receipt_url": receipt_url,
        "message": "Despesa extra com recibo registrada com sucesso.",
    }


@router.post("/close", status_code=200)
async def close_road(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: User = Depends(require_permissions("can_close_road")),
) -> dict:
    """
    Fecha a estrada — marca road_closed = True.

    REGRA DA BÍBLIA (Regra 03): Após o fechamento, o DRE pode ser
    consolidado (Etapa 6). Antes disso, apenas DRE provisório.
    """
    tenant_id = current_user.tenant_id

    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # Verifica se o show está em EM_ESTRADA para permitir fechamento
    if not show.can_close_road():
        from fastapi import HTTPException
        raise HTTPException(
            status_code=400,
            detail=f"Não é possível fechar a estrada. O show está em status {show.status.value}."
        )

    show.road_closed = True
    show.road_closed_at = datetime.now(timezone.utc)
    await db.flush()

    return {
        "show_id": str(show_id),
        "road_closed": True,
        "closed_at": show.road_closed_at.isoformat(),
        "message": "Estrada fechada! DRE liberado para consolidação.",
    }
