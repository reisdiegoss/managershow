"""
Manager Show — Router: Users (Client — Módulo de Equipe)
Permite que o administrador do Tenant gerencie seus usuários e permissões de visibilidade.
"""

import uuid
from typing import list
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.permissions import require_permissions
from app.models.user import User
from app.models.user_artist import UserArtistAccess
from app.models.artist import Artist
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["Client — Gestão de Equipe"])

class UserVisibilityUpdate(BaseModel):
    has_global_artist_access: bool
    artist_ids: list[uuid.UUID]

@router.get("/", response_model=list[dict])
async def list_users(
    db: DbSession,
    tenant_id: TenantId,
    current_user: CurrentUser = Depends(require_permissions("can_manage_users")),
):
    """Lista todos os usuários do tenant (exceto sensíveis)."""
    from sqlalchemy.orm import selectinload
    stmt = (
        select(User)
        .options(selectinload(User.role), selectinload(User.allowed_artists))
        .where(User.tenant_id == tenant_id)
    )
    result = await db.execute(stmt)
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "is_active": u.is_active,
            "has_global_artist_access": u.has_global_artist_access,
            "role": {"id": u.role.id, "name": u.role.name} if u.role else None,
            "allowed_artists": [{"id": a.id, "name": a.name} for a in u.allowed_artists]
        }
        for u in users
    ]

@router.patch("/{user_id}/visibility", status_code=200)
async def update_user_visibility(
    user_id: uuid.UUID,
    data: UserVisibilityUpdate,
    db: DbSession,
    tenant_id: TenantId,
    current_user: CurrentUser = Depends(require_permissions("can_manage_users")),
):
    """
    Atualiza a matriz de visibilidade do usuário (Fase 24).
    """
    # 1. Buscar usuário
    stmt = select(User).where(User.id == user_id, User.tenant_id == tenant_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")
    
    # 2. Atualizar flag global
    user.has_global_artist_access = data.has_global_artist_access
    
    # 3. Atualizar tabela de associação se não for global
    # Primeiro limpa as atuais
    await db.execute(delete(UserArtistAccess).where(UserArtistAccess.user_id == user_id))
    
    if not data.has_global_artist_access:
        for artist_id in data.artist_ids:
            # Validar se o artista pertence ao tenant
            stmt_artist = select(Artist).where(Artist.id == artist_id, Artist.tenant_id == tenant_id)
            art_check = await db.execute(stmt_artist)
            if art_check.scalar_one_or_none():
                access = UserArtistAccess(user_id=user_id, artist_id=artist_id)
                db.add(access)
    
    await db.flush()
    return {"message": "Visibilidade atualizada com sucesso."}
