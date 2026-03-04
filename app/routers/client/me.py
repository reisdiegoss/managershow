"""
Manager Show — Router: Me (Client — Perfil e Contexto)
Expõe dados do usuário logado e do Tenant (incluindo account_type para UI).
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.dependencies import CurrentUser, DbSession
from app.models.user import User
from app.models.tenant import Tenant

router = APIRouter(prefix="/me", tags=["Client — Contexto do Usuário"])

class UserMeResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str | None
    tenant: dict

@router.get("", response_model=UserMeResponse)
async def get_me(
    current_user: CurrentUser,
    db: DbSession
):
    """
    Retorna o perfil do usuário e metadados do Tenant (limites, tipo de conta).
    Essencial para a 'Type-Based UI' no Frontend.
    """
    # Obter dados do Tenant via relacionamento ou query direta
    tenant = current_user.tenant
    
    return {
        "id": str(current_user.id),
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role.name if current_user.role else None,
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "account_type": tenant.account_type,
            "users_limit": tenant.users_limit,
            "storage_limit_gb": tenant.storage_limit_gb,
            "whatsapp_limit": tenant.whatsapp_limit,
            "status": tenant.status
        }
    }
