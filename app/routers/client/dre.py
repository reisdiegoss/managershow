"""
Manager Show — Router: DRE (Client — Módulo 6: Borderô e DRE Automático)

Endpoint THIN — toda a matemática está em finance_service.py.
O router apenas busca o show e delega o cálculo.

REGRA DA BÍBLIA (Regra 03): DRE consolidado só após road_closed.
"""

import uuid
from dataclasses import asdict

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DbSession
from app.core.permissions import require_permissions
from app.core.tenant_filter import tenant_query
from app.exceptions import ShowNotFoundException
from app.models.show import Show
from app.models.user import User
from app.services.finance_service import calculate_dre

router = APIRouter(prefix="/shows/{show_id}/dre", tags=["Client — DRE"])


@router.get("/", summary="Get DRE")
async def get_dre(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: User = Depends(require_permissions("can_view_dre")),
) -> dict:
    """
    Calcula o DRE (Demonstrativo de Resultado) em tempo real.

    Toda a matemática financeira está isolada em finance_service.py.
    Se road_closed == False, retorna DRE provisório (estimativa).
    """
    tenant_id = current_user.tenant_id

    # --- Buscar Show com filtro multi-tenant ---
    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # --- Delegar cálculo ao service ---
    dre = await calculate_dre(db, show, tenant_id)

    # Converter DREResult para dict serializável
    dre_dict = asdict(dre)
    # Decimal -> str para serialização JSON
    for key, value in dre_dict.items():
        if hasattr(value, "quantize"):  # É Decimal
            dre_dict[key] = str(value)
    # Converter detalhes de comissão
    for detail_list_key in ("comissoes_bruto_detalhes", "comissoes_liquido_detalhes"):
        for detail in dre_dict[detail_list_key]:
            for k, v in detail.items():
                if hasattr(v, "quantize"):
                    detail[k] = str(v)

    return dre_dict
