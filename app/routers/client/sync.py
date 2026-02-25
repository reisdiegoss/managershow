"""
Manager Show — Router: Sync (Offline-First Integration)

Implementa o protocolo de sincronização do WatermelonDB.
"""

import time
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.core.tenant_filter import tenant_query
from app.schemas.sync import SyncPullResponse, SyncPushPayload, SyncEntry
from app.models.show import Show
from app.models.logistics_timeline import LogisticsTimeline
from app.models.show_checkin import ShowCheckin
from app.models.financial_transaction import FinancialTransaction

router = APIRouter(prefix="/sync", tags=["Client — Sync (Offline-First)"])

@router.get("/pull", response_model=SyncPullResponse)
async def pull_changes(
    last_pulled_at: int | None,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    PULL: O cliente solicita todas as mudanças ocorridas desde 'last_pulled_at'.
    """
    last_time = datetime.fromtimestamp(last_pulled_at / 1000) if last_pulled_at else None
    
    changes = {}
    tables = {
        "shows": Show,
        "logistics_timeline": LogisticsTimeline,
        "show_checkins": ShowCheckin,
        "financial_transactions": FinancialTransaction
    }

    for name, model in tables.items():
        stmt = tenant_query(model, tenant_id)
        if last_time:
            stmt = stmt.where(model.updated_at > last_time)
        
        result = await db.execute(stmt)
        records = result.scalars().all()
        
        changes[name] = SyncEntry(
            created=[r.to_dict() for r in records if not last_time or r.created_at > last_time],
            updated=[r.to_dict() for r in records if last_time and r.created_at <= last_time],
            deleted=[] # TODO: Implementar soft delete para rastrear deleções
        )

    return SyncPullResponse(
        changes=changes,
        timestamp=int(time.time() * 1000)
    )

@router.post("/push")
async def push_changes(
    payload: SyncPushPayload,
    last_pulled_at: int,
    db: DbSession,
    tenant_id: TenantId,
):
    """
    PUSH: O cliente envia as mudanças locais para o servidor.
    Implementa Upsert (Update or Insert) para as tabelas suportadas.
    """
    changes = payload.changes
    
    tables = {
        "shows": Show,
        "logistics_timeline": LogisticsTimeline,
        "show_checkins": ShowCheckin,
        "financial_transactions": FinancialTransaction
    }

    for table_name, model in tables.items():
        if table_name not in changes:
            continue
            
        table_changes = changes[table_name]
        
        # 1. Tratar Criações e Atualizações (Upsert)
        for record in table_changes.created + table_changes.updated:
            # Garantir que o record tenha o tenant_id correto
            record['tenant_id'] = tenant_id
            
            # Verificar se já existe (uso do ID enviado pelo cliente)
            record_id = uuid.UUID(record['id']) if isinstance(record['id'], str) else record['id']
            stmt = select(model).where(and_(model.id == record_id, model.tenant_id == tenant_id))
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                # Update
                for key, value in record.items():
                    if hasattr(existing, key) and key not in ['id', 'tenant_id', 'created_at']:
                        setattr(existing, key, value)
            else:
                # Insert
                new_record = model(**record)
                db.add(new_record)
        
        # 2. Tratar Deleções (Se o ID vier na lista de deletados)
        for record_id_str in table_changes.deleted:
            record_id = uuid.UUID(record_id_str)
            stmt = select(model).where(and_(model.id == record_id, model.tenant_id == tenant_id))
            result = await db.execute(stmt)
            existing = result.scalar_one_or_none()
            if existing:
                await db.delete(existing)
        
    await db.commit()
    return {"status": "ok", "message": "Sincronização concluída com sucesso."}
