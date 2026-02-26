from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.auth import get_current_user
from app.schemas.user import UserResponse
from app.schemas.tenant import TenantOnboardingUpdate, TenantResponse
from app.models.tenant import Tenant, TenantSettings
from loguru import logger

router = APIRouter()

@router.post("/complete", response_model=TenantResponse)
def complete_onboarding(
    payload: TenantOnboardingUpdate,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Finaliza o Wizard de Onboarding da Agência.
    (Self-Service SaaS - Step 1/2/3).
    Apenas Administradores principais podem prosseguir com isso.
    """
    if current_user.role.value != "admin":
        raise HTTPException(
            status_code=403,
            detail="Apenas administradores podem configurar o Onboarding do Manger Show.",
        )

    # 1. Recuperar Tenant via User Context
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não localizado.")

    if tenant.is_onboarded:
        raise HTTPException(
            status_code=400,
            detail="A agência já concluiu o Onboarding anteriormente.",
        )

    # 2. Configurar Settings atreladas ao Tenant
    tenant_settings = db.query(TenantSettings).filter(TenantSettings.tenant_id == tenant.id).first()
    
    if not tenant_settings:
        logger.warning(f"Tenant {tenant.id} não possuía settings default. Criando para Onboarding...")
        tenant_settings = TenantSettings(tenant_id=tenant.id)
        db.add(tenant_settings)

    if payload.primary_color:
        tenant_settings.primary_color = payload.primary_color
        
    if payload.negotiation_setup:
        tenant_settings.negotiation_setup = payload.negotiation_setup
        
    # TODO: O upload de logo_url via File() seria injetado aqui vindo do S3 no futuro
    
    # 3. Marcar a bandeira mestra de onboamento
    tenant.is_onboarded = True

    try:
        db.commit()
        db.refresh(tenant)
        logger.info(f"[ONBOARDING COMPLETE] Tenant ID: {tenant.id} liberado para uso do ERP.")
        return tenant
    except Exception as e:
        db.rollback()
        logger.error(f"[ONBOARDING ERROR] Falha ao tramitar config tenant {tenant.id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Ocorreu um erro ao finalizar o Onboarding da sua Agência."
        )
