"""
Manager Show — Router: Audit Logs (Retaguarda)

Visualização de ações críticas realizadas no Super Admin.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func
from app.core.dependencies import DbSession
from app.core.auth import get_current_super_admin
from app.models.audit_log import AuditLog
from app.schemas.common import PaginatedResponse
from pydantic import BaseModel
from datetime import datetime
import uuid

router = APIRouter(
    prefix="/audit",
    tags=["Retaguarda — Auditoria"],
    dependencies=[Depends(get_current_super_admin)]
)

class AuditLogResponse(BaseModel):
    id: uuid.UUID
    admin_id: str
    action: str
    target_id: str | None
    details: dict
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=PaginatedResponse[AuditLogResponse])
async def list_audit_logs(
    db: DbSession,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
) -> dict:
    """Lista logs de auditoria com paginação."""
    offset = (page - 1) * page_size

    count_stmt = select(func.count()).select_from(AuditLog)
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = select(AuditLog).offset(offset).limit(page_size).order_by(AuditLog.created_at.desc())
    result = await db.execute(stmt)
    logs = result.scalars().all()

    return {
        "items": logs,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }
