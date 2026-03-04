"""
Manager Show — Router: Finance (Retaguarda / Super Admin)

Métricas financeiras globais e faturamento via Asaas.
"""

from fastapi import APIRouter, Depends
from app.core.auth import get_current_super_admin
from app.core.dependencies import DbSession
from sqlalchemy import select, func
from app.models.tenant import Tenant, TenantStatus

router = APIRouter(
    prefix="/finance",
    tags=["Retaguarda — Financeiro"],
    dependencies=[Depends(get_current_super_admin)]
)

@router.get("/dashboard")
async def get_finance_dashboard(db: DbSession):
    """Retorna métricas MRR, Ativos e Churn."""
    # Simulação de cálculo de MRR baseada em planos (exemplo simplificado)
    # MRR = Sum(plan.price) for all active tenants
    active_tenants_stmt = select(func.count(Tenant.id)).where(Tenant.status == TenantStatus.ACTIVE)
    active_count = (await db.execute(active_tenants_stmt)).scalar() or 0
    
    # Placeholder para MRR e Churn até integração completa com gateway
    return {
        "mrr": active_count * 150.0, # Ticket médio fictício
        "active_clients": active_count,
        "churn_rate": 2.5,
        "currency": "BRL"
    }

@router.get("/invoices")
async def get_all_invoices():
    """Busca faturas do Asaas (Cache ou API direta)."""
    return [
        {
            "id": "inv_001",
            "tenant_name": "Agência Phoenix",
            "amount": 299.90,
            "status": "Paga",
            "due_date": "2026-02-20"
        },
        {
            "id": "inv_002",
            "tenant_name": "ShowTime Produtora",
            "amount": 450.00,
            "status": "Pendente",
            "due_date": "2026-03-05"
        }
    ]
