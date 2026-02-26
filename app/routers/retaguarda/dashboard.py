from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import select, func, count
from app.core.dependencies import DbSession
from app.models.tenant import Tenant, TenantStatus
from app.models.saas_payment_log import SaaSPaymentLog

router = APIRouter(prefix="/dashboard", tags=["Retaguarda — Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(db: DbSession):
    """
    Retorna os KPIs globais para o dashboard da Retaguarda.
    """
    # 1. Total de Tenants Ativos
    stmt_active = select(count()).select_from(Tenant).where(Tenant.status == TenantStatus.ACTIVE)
    res_active = await db.execute(stmt_active)
    total_active = res_active.scalar() or 0

    # 2. Tenants em Trial
    stmt_trial = select(count()).select_from(Tenant).where(Tenant.status == TenantStatus.TRIAL)
    res_trial = await db.execute(stmt_trial)
    total_trial = res_trial.scalar() or 0

    # 3. MRR Estimado (Soma dos pagamentos CONFIRMED nos últimos 30 dias)
    thirty_days_ago = datetime.now() - timedelta(days=30)
    stmt_mrr = select(func.sum(SaaSPaymentLog.amount)).where(
        SaaSPaymentLog.event_type.in_(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]),
        SaaSPaymentLog.processed_at >= thirty_days_ago
    )
    res_mrr = await db.execute(stmt_mrr)
    mrr = float(res_mrr.scalar() or 0)

    # 4. Tendência (Comparação com os 30-60 dias anteriores - Simplificação)
    # Aqui poderíamos fazer uma lógica mais complexa, mas vamos manter simples por enquanto.

    return {
        "mrr": mrr,
        "active_tenants": total_active,
        "trial_tenants": total_trial,
        "churn_rate": 2.4, # Mock fixo por enquanto, requer lógica de cancelamento histórica
        "open_tickets": 14 # Mock fixo, requer integração com o model Ticket
    }

@router.get("/charts/growth")
async def get_growth_chart(db: DbSession):
    """
    Retorna os dados para o gráfico de crescimento (assinaturas vs cancelamentos).
    Ultimos 6 meses.
    """
    # Simplificação: Mock estruturado para o frontend, mas pronto para query real no futuro
    return [
        {"name": 'Set', "assinaturas": 4, "cancelamentos": 1},
        {"name": 'Out', "assinaturas": 7, "cancelamentos": 0},
        {"name": 'Nov', "assinaturas": 5, "cancelamentos": 2},
        {"name": 'Dez', "assinaturas": 12, "cancelamentos": 1},
        {"name": 'Jan', "assinaturas": 18, "cancelamentos": 3},
        {"name": 'Fev', "assinaturas": 24, "cancelamentos": 2},
    ]
