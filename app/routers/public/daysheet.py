import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.models.show import Show
from app.models.show_crew import ShowCrew
from app.models.logistics_timeline import LogisticsTimeline
from app.services.logistics_service import LogisticsService
from app.schemas.show_crew import ReadReceiptUpdate

router = APIRouter(prefix="/public/daysheet", tags=["Public DaySheet"])

@router.get("/{show_id}")
async def get_public_daysheet(
    show_id: uuid.UUID,
    m_id: uuid.UUID = Query(None, alias="m"),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Retorna os dados do roteiro de show para acesso público via Smart Share.
    """
    # 1. Busca o show
    stmt = select(Show).where(Show.id == show_id)
    result = await db.execute(stmt)
    show = result.scalar_one_or_none()

    if not show:
        raise HTTPException(status_code=404, detail="Show não encontrado")

    # 2. Busca a Timeline (Logística)
    stmt_timeline = select(LogisticsTimeline).where(
        LogisticsTimeline.show_id == show_id
    ).order_by(LogisticsTimeline.event_time.asc())
    result_timeline = await db.execute(stmt_timeline)
    timeline = result_timeline.scalars().all()

    # 3. Busca Previsão do Tempo (OpenWeather via Service)
    weather = await LogisticsService.get_weather_forecast(show.location_city, str(show.show_date))

    return {
        "show": {
            "id": show.id,
            "city": show.location_city,
            "uf": show.location_uf,
            "date": show.show_date,
            "artist": show.artist.name if show.artist else "Artista"
        },
        "timeline": [
            {
                "id": item.id,
                "time": item.event_time,
                "description": item.description,
                "type": item.event_type
            } for item in timeline
        ],
        "weather": weather,
        "member_context": {"id": m_id} if m_id else None
    }

@router.get("/crew/{token}/read")
async def register_read_receipt(
    token: uuid.UUID,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Endpoint silencioso (Pixel/Async Hook) que marca o roteiro como LIDO (Smart Share).
    Retorna apenas um 200 OK ou Status de tracker para não quebrar navegadores se acessada por IMG SRC.
    """
    stmt = update(ShowCrew).where(
        ShowCrew.token == token
    ).values(
        read_receipt=True,
        read_at=datetime.now()
    )
    
    result = await db.execute(stmt)
    await db.commit()

    if result.rowcount == 0:
        # Silencioso, sem necessidade de explodir exception na View Publica caso token seja old.
        return {"status": "ignored"}

    return {"status": "success", "read_at": datetime.now().isoformat()}
