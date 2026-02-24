"""
Manager Show — Model: Role (Perfil de Permissões RBAC)

O motor de permissões granulares utiliza JSONB no PostgreSQL para
armazenar a matriz de permissões de cada perfil.

Ações granulares incluem:
- can_view_financials
- can_approve_contracts
- can_add_expenses
- can_manage_users
- can_view_dre
- can_close_road (Fechamento de Estrada)
- can_manage_daysheet
- etc.

Endpoint de clonagem: POST /roles/{id}/clone
"""

import uuid

from sqlalchemy import String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TenantMixin, TimestampMixin

# Permissões padrão — usado como template ao criar novos perfis
DEFAULT_PERMISSIONS: dict[str, bool] = {
    # --- Financeiro ---
    "can_view_financials": False,
    "can_view_dre": False,
    "can_manage_commissions": False,

    # --- Contratos ---
    "can_approve_contracts": False,
    "can_generate_contracts": False,

    # --- Shows ---
    "can_create_shows": False,
    "can_edit_shows": False,
    "can_delete_shows": False,
    "can_simulate_shows": False,

    # --- Logística / Pré-Produção ---
    "can_add_expenses": False,
    "can_manage_daysheet": False,

    # --- Estrada ---
    "can_close_road": False,
    "can_checkin_crew": False,
    "can_add_extra_expenses": False,

    # --- Administrativo ---
    "can_manage_users": False,
    "can_manage_roles": False,
    "can_manage_artists": False,
    "can_manage_contractors": False,

    # --- Super (tudo liberado) ---
    "is_admin": False,
}


class Role(TenantMixin, TimestampMixin, Base):
    """
    Perfil de permissões (RBAC) com matriz JSONB.

    Cada tenant define seus próprios perfis (Admin, Produtor, Vendedor,
    Músico, etc.). O campo permissions armazena um dicionário JSON
    com booleans para cada ação granular.

    Exemplo de permissions:
    {
        "is_admin": true,
        "can_view_financials": true,
        "can_approve_contracts": true,
        ...
    }
    """

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        comment="Nome do perfil (ex: Admin, Produtor, Músico)",
    )
    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        comment="Descrição do perfil de permissões",
    )
    permissions: Mapped[dict] = mapped_column(
        JSONB,
        default=DEFAULT_PERMISSIONS,
        nullable=False,
        comment="Matriz JSONB de permissões granulares",
    )

    # --- Relacionamentos ---
    tenant: Mapped["Tenant"] = relationship(  # noqa: F821
        back_populates="roles",
        lazy="raise",
    )
    users: Mapped[list["User"]] = relationship(  # noqa: F821
        back_populates="role",
        lazy="raise",
    )

    def has_permission(self, permission: str) -> bool:
        """
        Verifica se este perfil possui uma permissão específica.

        Se is_admin for True, todas as permissões são concedidas.
        """
        if self.permissions.get("is_admin", False):
            return True
        return self.permissions.get(permission, False)

    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name='{self.name}')>"
