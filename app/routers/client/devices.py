from fastapi import APIRouter, Header, Depends, HTTPException
from sqlalchemy import select
import uuid
from datetime import datetime
from pydantic import BaseModel

from app.core.dependencies import CurrentUser, DbSession, TenantId
from app.models.device_token import DeviceToken

router = APIRouter(prefix="/devices", tags=["Client — Mobile Ecosystem"])

class RegisterDevicePayload(BaseModel):
    fcm_token: str
    platform: str # 'ios', 'android', 'web'
    device_name: str | None = None

@router.post("/register", status_code=201)
async def register_device_token(
    payload: RegisterDevicePayload,
    db: DbSession,
    tenant_id: TenantId,
    current_user: CurrentUser,
) -> dict:
    """
    Registra ou Atualiza o Token de Notificação (FCM) para o Usuário atual.
    
    Chamado pelo aplicativo React Native / PWA logo após o Login ou 
    após permissões do usuário.
    """
    if not payload.fcm_token:
        raise HTTPException(status_code=400, detail="FCM Token is required")

    # Verifica se esse token Específico já foi anexado na Base. 
    # O FCM Token gira sozinho por motivos de segurança, se atualizar é tratado como novo.
    stmt = select(DeviceToken).where(DeviceToken.fcm_token == payload.fcm_token)
    result = await db.execute(stmt)
    existing_device = result.scalar_one_or_none()

    if existing_device:
        # Se esse Token já existe, vamos atualizar que agora pertence a ESSE usuário
        if existing_device.user_id != current_user.id:
            existing_device.user_id = current_user.id
        existing_device.last_active = datetime.utcnow()
    else:
        # Cria um novo tracking
        new_device = DeviceToken(
            tenant_id=tenant_id,
            user_id=current_user.id,
            fcm_token=payload.fcm_token,
            platform=payload.platform,
            device_name=payload.device_name,
        )
        db.add(new_device)

    await db.commit()

    return {"status": "success", "message": "Device token registered"}

@router.delete("/unregister/{fcm_token}", status_code=200)
async def unregister_device_token(
    fcm_token: str,
    db: DbSession,
    tenant_id: TenantId,
    current_user: CurrentUser,
) -> dict:
    """
    Revoga um Push Notification Token ao deslogar da Application Mobile.
    Assim não haverá leaks p/ celulares velhos / resetados.
    """
    stmt = select(DeviceToken).where(
        DeviceToken.fcm_token == fcm_token,
        DeviceToken.user_id == current_user.id
    )
    result = await db.execute(stmt)
    device = result.scalar_one_or_none()

    if device:
        await db.delete(device)
        await db.commit()
    
    return {"status": "success", "message": "Device token untracked."}
