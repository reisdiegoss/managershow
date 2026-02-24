"""
Manager Show — Router: Venues (Client)
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DbSession, CurrentUser
from app.core.tenant_filter import tenant_query
from app.models.venue import Venue
from app.schemas.venue import VenueCreate, VenueResponse

router = APIRouter(prefix="/venues", tags=["Client — Locais"])


@router.get("/", response_model=list[VenueResponse])
async def list_venues(
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Lista todos os locais (venues) do tenant.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(Venue, tenant_id).order_by(Venue.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=VenueResponse, status_code=201)
async def create_venue(
    payload: VenueCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Cria um novo local (venue) para o tenant.
    """
    tenant_id = current_user.tenant_id
    venue = Venue(
        tenant_id=tenant_id,
        **payload.model_dump()
    )
    db.add(venue)
    await db.flush()
    await db.refresh(venue)
    return venue
