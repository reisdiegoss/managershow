"""
Manager Show — Router: Contractors (Client)
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.core.dependencies import DbSession, CurrentUser
from app.core.tenant_filter import tenant_query
from app.models.contractor import Contractor
from app.schemas.contractor import ContractorCreate, ContractorResponse

router = APIRouter(prefix="/contractors", tags=["Client — Contratantes"])


@router.get("/", response_model=list[ContractorResponse])
async def list_contractors(
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Lista todos os contratantes do tenant.
    """
    tenant_id = current_user.tenant_id
    stmt = tenant_query(Contractor, tenant_id).order_by(Contractor.name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/", response_model=ContractorResponse, status_code=201)
async def create_contractor(
    payload: ContractorCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """
    Cria um novo contratante para o tenant.
    """
    tenant_id = current_user.tenant_id
    contractor = Contractor(
        tenant_id=tenant_id,
        **payload.model_dump()
    )
    db.add(contractor)
    await db.flush()
    await db.refresh(contractor)
    return contractor
