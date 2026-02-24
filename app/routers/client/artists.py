"""
Manager Show — Router: Artists (Client)
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DbSession, CurrentUser
from app.core.tenant_filter import tenant_query
from app.models.artist import Artist
from app.schemas.artist import ArtistResponse

router = APIRouter(prefix="/artists", tags=["Client — Artistas"])


@router.get("/", response_model=list[ArtistResponse])
async def list_artists(
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Lista todos os artistas do tenant.
    Utilizado para popular selects no frontend.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(Artist, tenant_id).order_by(Artist.name)
    result = await db.execute(stmt)
    return result.scalars().all()
