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
    """Adiciona um item à timeline do Day Sheet com inteligência climática."""
    tenant_id = current_user.tenant_id

    stmt = tenant_query(Show, tenant_id).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    # Inicializar campos inteligentes
    weather_data = {"temp": None, "condition": None}
    
    # 1. Busca Clima (Fase 27) - Se houver cidade definida
    if show.location_city:
        from app.services.logistics_service import LogisticsService
        weather_data = await LogisticsService.get_weather_forecast(
            show.location_city, 
            show.date_show.isoformat()
        )

    item = LogisticsTimeline(
        tenant_id=tenant_id,
        show_id=show_id,
        weather_temp=weather_data["temp"],
        weather_condition=weather_data["condition"],
        **payload.model_dump(),
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=TimelineItemResponse)
async def update_timeline_item(
    show_id: uuid.UUID,
    item_id: uuid.UUID,
    payload: TimelineItemCreate,
    db: DbSession,
    current_user: CurrentUser,
) -> LogisticsTimeline:
    """Atualiza um item da timeline."""
    tenant_id = current_user.tenant_id
    
    stmt = tenant_query(LogisticsTimeline, tenant_id).where(
        LogisticsTimeline.id == item_id,
        LogisticsTimeline.show_id == show_id
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado.")
    
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    await db.flush()
    await db.refresh(item)
    return item


@router.post("/smart-sync", summary="Smart Logistics Sync", status_code=200)
async def smart_sync_logistics(
    show_id: uuid.UUID,
    db: DbSession,
    current_user: CurrentUser,
) -> dict:
    """
    Sincronização Inteligente (Fase 27):
    - Calcula rotas (Google Maps) entre itens sequenciais.
    - Atualiza clima (OpenWeather) para todos os itens.
    """
    tenant_id = current_user.tenant_id
    from app.services.logistics_service import LogisticsService

    # 1. Busca Show e Timeline
    stmt_show = tenant_query(Show, tenant_id).where(Show.id == show_id)
    show_res = await db.execute(stmt_show)
    show = show_res.scalar_one_or_none()
    if not show:
        raise ShowNotFoundException(show_id)

    stmt_tl = (
        tenant_query(LogisticsTimeline, tenant_id)
        .where(LogisticsTimeline.show_id == show_id)
        .order_by(LogisticsTimeline.order, LogisticsTimeline.time)
    )
    tl_res = await db.execute(stmt_tl)
    items = tl_res.scalars().all()

    # 2. Processamento em Lote
    updated_count = 0
    for i in range(len(items)):
        item = items[i]
        
        # A) Atualiza Clima
        weather = await LogisticsService.get_weather_forecast(show.location_city, show.date_show.isoformat())
        item.weather_temp = weather["temp"]
        item.weather_condition = weather["condition"]

        # B) Calcula Rota (se houver um próximo item e for deslocamento)
        if i < len(items) - 1:
            next_item = items[i+1]
            # Se o item atual ou o próximo for do tipo transporte/logística
            if item.icon_type in ("flight", "van", "bus") or "Voo" in item.title or "Viagem" in item.title:
                route = await LogisticsService.get_route_details(item.title, next_item.title)
                item.route_distance = route["distance"]
                item.route_duration = route["duration"]
        
        updated_count += 1

    await db.flush()

    return {
        "show_id": str(show_id),
        "items_updated": updated_count,
        "message": "Inteligência logística aplicada com sucesso!"
    }


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
