from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update, delete
from app.core.dependencies import DbSession, CurrentUser
from app.core.tenant_filter import tenant_query
from app.models.artist_crew import ArtistCrew
from app.schemas.artist_crew import ArtistCrewCreate, ArtistCrewUpdate, ArtistCrewResponse

router = APIRouter(prefix="/artists", tags=["Client — Equipe do Artista"])

@router.get("/{artist_id}/crew", response_model=list[ArtistCrewResponse])
async def list_artist_crew(
    artist_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Lista todos os membros da equipe fixa de um artista específico.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(ArtistCrew, tenant_id).filter(ArtistCrew.artist_id == artist_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/{artist_id}/crew", response_model=ArtistCrewResponse, status_code=status.HTTP_201_CREATED)
async def create_crew_member(
    artist_id: UUID,
    crew_in: ArtistCrewCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Cria um novo membro na equipe fixa do artista (Folha de Pagamento).
    """
    crew_member = ArtistCrew(
        **crew_in.model_dump(),
        artist_id=artist_id,
        tenant_id=current_user.tenant_id
    )
    db.add(crew_member)
    await db.commit()
    await db.refresh(crew_member)
    return crew_member

@router.patch("/crew/{crew_id}", response_model=ArtistCrewResponse)
async def update_crew_member(
    crew_id: UUID,
    crew_in: ArtistCrewUpdate,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Atualiza dados de um membro da equipe (ex: aumento de cachê).
    """
    tenant_id = current_user.tenant_id
    # Verificar existência e tenant
    stmt = tenant_query(ArtistCrew, tenant_id).filter(ArtistCrew.id == crew_id)
    result = await db.execute(stmt)
    crew_member = result.scalar_one_or_none()
    
    if not crew_member:
        raise HTTPException(status_code=404, detail="Membro da equipe não encontrado")

    update_data = crew_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crew_member, field, value)

    await db.commit()
    await db.refresh(crew_member)
    return crew_member

@router.delete("/crew/{crew_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crew_member(
    crew_id: UUID,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Remove um membro da equipe fixa do artista.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(ArtistCrew, tenant_id).filter(ArtistCrew.id == crew_id)
    result = await db.execute(stmt)
    crew_member = result.scalar_one_or_none()

    if not crew_member:
        raise HTTPException(status_code=404, detail="Membro da equipe não encontrado")

    await db.delete(crew_member)
    await db.commit()
    return None
