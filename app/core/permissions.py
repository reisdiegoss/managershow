"""
Manager Show — Motor de Permissões Granulares (RBAC)

Implementa o decorator require_permissions() que valida se o
usuário logado possui as permissões necessárias para executar
uma ação.

Uso nos endpoints:
    @router.post("/shows/{show_id}/contracts/validate")
    async def validate_contract(
        current_user: User = Depends(require_permissions("can_approve_contracts")),
    ):

Se is_admin == True no Role, todas as permissões são concedidas.
"""

from collections.abc import Callable
from typing import Annotated

from fastapi import Depends

from app.core.auth import get_current_user
from app.exceptions import PermissionDeniedException
from app.models.user import User


def require_permissions(*permissions: str) -> Callable:
    """
    Fábrica de dependências que valida permissões RBAC.

    Recebe uma ou mais strings de permissão (ex: 'can_view_financials',
    'can_approve_contracts'). Todas devem ser True no JSONB do Role
    do usuário para que o acesso seja concedido.

    Se o usuário for is_admin, o bypass é automático.

    Exemplo de uso:
        @router.get("/dre/{show_id}")
        async def get_dre(
            current_user: User = Depends(require_permissions("can_view_financials", "can_view_dre")),
        ):
    """

    async def _check_permissions(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        # Sem role atribuído → acesso negado
        if not current_user.role:
            raise PermissionDeniedException(", ".join(permissions))

        # Validar cada permissão exigida
        for perm in permissions:
            if not current_user.role.has_permission(perm):
                raise PermissionDeniedException(perm)

        return current_user

    return _check_permissions
