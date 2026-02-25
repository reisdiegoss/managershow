"""
Manager Show — Model: User (Usuário)

Cada usuário pertence a um Tenant e está associado a um Role (RBAC).
O clerk_id é o identificador único do Clerk, usado para vincular
o JWT recebido nos requests ao usuário no banco de dados.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin


class User(TenantMixin, TimestampMixin, Base):
    """
    Usuário do sistema Manager Show.

    Cada usuário é vinculado a:
    - Um Tenant (escritório/agência) via TenantMixin
    - Um Role (perfil de permissões) via role_id
    - Um ID no Clerk (provedor de autenticação) via clerk_id
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    clerk_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
        comment="ID único do usuário no Clerk (provedor de auth)",
    )
    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="E-mail do usuário",
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Nome completo do usuário",
    )
    role_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="SET NULL"),
        nullable=True,
        comment="Perfil RBAC do usuário",
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        comment="Se False, o usuário está desativado e não pode acessar a API",
    )
    has_global_artist_access: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default="false",
        nullable=False,
        comment="Se True, ignora a tabela de associação e vê todos os artistas do tenant",
    )

    # --- Relacionamentos ---
    tenant: Mapped["Tenant"] = relationship(  # noqa: F821
        back_populates="users",
        lazy="raise",
    )
    role: Mapped["Role | None"] = relationship(  # noqa: F821
        back_populates="users",
        lazy="raise",
    )
    allowed_artists: Mapped[list["Artist"]] = relationship( # noqa: F821
        "Artist",
        secondary="user_artists",
        lazy="selectin",
        viewonly=True
    )
    seller_profile: Mapped["Seller | None"] = relationship(
        back_populates="user",
        uselist=False,
        lazy="select",
    )

    @property
    def allowed_artist_ids(self) -> list[uuid.UUID]:
        """Retorna a lista de IDs de artistas permitidos para este usuário."""
        if self.has_global_artist_access:
            return []  # Vazio significa todos
        return [artist.id for artist in self.allowed_artists]

    def __repr__(self) -> str:
        return f"<User(id={self.id}, name='{self.name}', clerk_id='{self.clerk_id}')>"
