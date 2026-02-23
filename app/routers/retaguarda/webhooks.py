"""
Manager Show — Router: Webhooks Asaas (Retaguarda)

Endpoint POST /webhooks/asaas que recebe notificações de pagamento.

Regras:
- Se pagamento "CONFIRMED"/"RECEIVED" → renova tenant por 30 dias
- Se pagamento "OVERDUE" → suspende o tenant (bloqueia API do client)
- Valida o token de autenticação do Asaas no header
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Header, HTTPException, Request
from sqlalchemy import select

from app.config import get_settings
from app.core.dependencies import DbSession
from app.models.tenant import Tenant, TenantStatus

router = APIRouter(prefix="/webhooks", tags=["Retaguarda — Webhooks"])


@router.post("/asaas", status_code=200)
async def asaas_webhook(
    request: Request,
    db: DbSession,
    asaas_access_token: str | None = Header(None, alias="asaas-access-token"),
) -> dict:
    """
    Webhook do Asaas para gerenciar assinaturas SaaS.

    Recebe notificações de pagamento e atualiza o status do tenant:
    - PAYMENT_CONFIRMED / PAYMENT_RECEIVED → Renova por 30 dias
    - PAYMENT_OVERDUE → Suspende acesso à API do cliente
    """
    settings = get_settings()

    # Validar token do Asaas (proteção contra chamadas não autorizadas)
    if asaas_access_token != settings.asaas_webhook_token:
        raise HTTPException(status_code=401, detail="Token de webhook inválido.")

    body = await request.json()

    event_type = body.get("event")
    payment = body.get("payment", {})
    # O external_reference do Asaas deve conter o tenant_id
    tenant_id = payment.get("externalReference")

    if not tenant_id:
        return {"status": "ignored", "reason": "externalReference ausente"}

    # Buscar tenant no banco
    stmt = select(Tenant).where(Tenant.id == tenant_id)
    result = await db.execute(stmt)
    tenant = result.scalar_one_or_none()

    if not tenant:
        return {"status": "ignored", "reason": "tenant não encontrado"}

    # Processar evento de pagamento
    if event_type in ("PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"):
        tenant.status = TenantStatus.ACTIVE
        tenant.subscription_expires_at = datetime.now(timezone.utc) + timedelta(days=30)

    elif event_type == "PAYMENT_OVERDUE":
        tenant.status = TenantStatus.SUSPENDED

    await db.flush()

    return {"status": "processed", "event": event_type, "tenant_id": str(tenant_id)}
