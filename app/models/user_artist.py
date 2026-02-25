"""
Manager Show — Model: UserArtistAccess
Tabela intermediária para controle de visibilidade de artistas por usuário.
"""

import uuid
from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base

class UserArtistAccess(Base):
    """
    Associa um usuário a um artista específico.
    Se o usuário NÃO tiver 'has_global_artist_access', ele verá apenas
    dados dos artistas listados nesta tabela.
    """
    __tablename__ = "user_artists"

    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True
    )
    artist_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("artists.id", ondelete="CASCADE"),
        primary_key=True
    )
