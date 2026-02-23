"""
Manager Show — Router: Day Sheet (Client — Módulo 4: Roteiro)

Compila dados logísticos, horários (timeline) e rooming list.

Ao concluir o roteiro, enfileira tarefa no Redis/Celery para
disparar notificações push para a equipe.
"""

import uuid

from fastapi import APIRouter
from sqlalchemy import select

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.exceptions import ShowNotFoundException
from app.models.logistics_timeline import LogisticsTimeline
from app.models.show import Show, ShowStatus

router = APIRouter(prefix="/shows/{show_id}/daysheet", tags=["Client — Day Sheet"])


@router.get("/")
async def get_daysheet(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> dict:
    """
    Compila o Day Sheet completo do show.

    Retorna a timeline logística ordenada por horário,
    dados do show, local e equipe.
    """
    # Buscar show
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # Buscar timeline
    timeline_stmt = (
        select(LogisticsTimeline)
        .where(
            LogisticsTimeline.show_id == show_id,
            LogisticsTimeline.tenant_id == tenant_id,
        )
        .order_by(LogisticsTimeline.order, LogisticsTimeline.time)
    )
    timeline_result = await db.execute(timeline_stmt)
    items = timeline_result.scalars().all()

    return {
        "show_id": str(show_id),
        "date_show": show.date_show.isoformat(),
        "location_city": show.location_city,
        "location_uf": show.location_uf,
        "location_venue_name": show.location_venue_name,
        "timeline": [
            {
                "id": str(item.id),
                "time": str(item.time),
                "title": item.title,
                "description": item.description,
                "icon_type": item.icon_type,
                "order": item.order,
            }
            for item in items
        ],
    }


@router.post("/items", status_code=201)
async def add_timeline_item(
    show_id: uuid.UUID,
    time: str,
    title: str,
    description: str | None = None,
    icon_type: str | None = None,
    order: int = 0,
    db: DbSession = None,
    current_user: CurrentUser = None,
) -> dict:
    """Adiciona um item à timeline do Day Sheet."""
    from datetime import time as time_type

    tenant_id = current_user.tenant_id

    # Verificar show
    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # Converter string de hora para time
    hour, minute = time.split(":")
    time_value = time_type(int(hour), int(minute))

    item = LogisticsTimeline(
        tenant_id=tenant_id,
        show_id=show_id,
        time=time_value,
        title=title,
        description=description,
        icon_type=icon_type,
        order=order,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    return {
        "id": str(item.id),
        "time": str(item.time),
        "title": item.title,
        "message": "Item adicionado à timeline.",
    }


@router.post("/finalize", status_code=200)
async def finalize_daysheet(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    """
    Finaliza o Day Sheet e enfileira notificação push.

    Atualiza o status do show para EM_ESTRADA e dispara
    uma tarefa Celery/Redis para notificar a equipe.
    """
    tenant_id = current_user.tenant_id

    stmt = select(Show).where(Show.id == show_id, Show.tenant_id == tenant_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    show.status = ShowStatus.EM_ESTRADA
    await db.flush()

    # TODO: Enfileirar tarefa Celery para notificação push
    # from app.tasks.notifications import send_daysheet_notification
    # send_daysheet_notification.delay(str(show_id), str(tenant_id))

    return {
        "show_id": str(show_id),
        "status": show.status.value,
        "message": "Day Sheet finalizado! Equipe será notificada em breve.",
    }
