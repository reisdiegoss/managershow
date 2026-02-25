"""
Manager Show — Router: Day Sheet (Client — Módulo 4: Roteiro)

Timeline logística + finalização com notificação.
"""

import uuid

from fastapi import APIRouter

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.tenant_filter import tenant_query
from app.exceptions import ShowNotFoundException
from app.models.logistics_timeline import LogisticsTimeline
from app.models.show import Show, ShowStatus
from app.schemas.logistics_timeline import TimelineItemCreate, TimelineItemResponse

router = APIRouter(prefix="/shows/{show_id}/daysheet", tags=["Client — Day Sheet"])


@router.get("/", summary="Get Day Sheet")
async def get_daysheet(
    show_id: uuid.UUID,
    db: DbSession,
    tenant_id: TenantId,
) -> dict:
    """Compila o Day Sheet completo (timeline + dados do show)."""
    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # Timeline filtrada por tenant
    timeline_stmt = (
        tenant_query(LogisticsTimeline, tenant_id)
        .where(LogisticsTimeline.show_id == show_id)
        .order_by(LogisticsTimeline.order, LogisticsTimeline.time)
    )
    timeline_result = await db.execute(timeline_stmt)
    items = timeline_result.scalars().all()

    return {
        "show_id": str(show_id),
        "date_show": show.date_show.isoformat() if show.date_show else None,
        "location_city": show.location_city,
        "location_uf": show.location_uf,
        "location_venue_name": show.location_venue_name,
        "timeline": [
            TimelineItemResponse.model_validate(item).model_dump()
            for item in items
        ],
    }


@router.post(
    "/items",
    summary="Add Timeline Item",
    response_model=TimelineItemResponse,
    status_code=201,
)
async def add_timeline_item(
    show_id: uuid.UUID,
    payload: TimelineItemCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> LogisticsTimeline:
    """Adiciona um item à timeline do Day Sheet (validado por schema Pydantic)."""
    tenant_id = current_user.tenant_id

    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    item = LogisticsTimeline(
        tenant_id=tenant_id,
        show_id=show_id,
        **payload.model_dump(),
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.post("/publish", summary="Publish Day Sheet & Notify Crew", status_code=200)
async def publish_daysheet(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    """
    Publica o Day Sheet e dispara notificações em background para a equipe.
    Este é o 'Information Push' que retira o peso operacional das costas do produtor.
    """
    tenant_id = current_user.tenant_id

    # 1. Busca o Show e valida permissão
    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # 2. Atualiza Status para EM_ESTRADA (Publicado)
    show.status = ShowStatus.EM_ESTRADA
    await db.flush()

    # 3. Disparo da Task Celery (Background)
    try:
        from app.tasks.notifications import notify_crew_about_daysheet
        notify_crew_about_daysheet.delay(str(show_id), str(tenant_id))
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Falha ao enfileirar task de notificação: {str(e)}")
        # Não travamos a resposta se o worker falhar, mas logamos o erro

    return {
        "show_id": str(show_id),
        "status": show.status.value,
        "message": "Roteiro publicado e equipe notificada com sucesso!",
    }


@router.post("/finalize", summary="Finalize Day Sheet", status_code=200)
async def finalize_daysheet(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:

    """Finaliza o Day Sheet → status EM_ESTRADA."""
    tenant_id = current_user.tenant_id

    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    show.status = ShowStatus.EM_ESTRADA
    await db.flush()

    return {
        "show_id": str(show_id),
        "status": show.status.value,
        "message": "Day Sheet finalizado! Equipe será notificada.",
    }
