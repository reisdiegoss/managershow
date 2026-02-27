"""
Manager Show — Router: Settings Gerais da Plataforma
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.auth import get_current_super_admin
from app.database import get_db
from app.models.system_settings import SystemSettings
from app.services.evolution_api_service import EvolutionApiService

router = APIRouter(
    prefix="/settings",
    tags=["Retaguarda — Configurações"],
    dependencies=[Depends(get_current_super_admin)]
)

@router.get("/whatsapp")
async def get_whatsapp_settings(db: AsyncSession = Depends(get_db)):
    """Busca as configurações de WhatsApp e o status atual da instância."""
    stmt = select(SystemSettings).limit(1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()

    if not settings:
        return {
            "is_whatsapp_active": False,
            "evolution_api_url": "",
            "evolution_api_key": "",
            "evolution_instance_name": "",
            "status": "NOT_CONFIGURED"
        }

    status = await EvolutionApiService.get_connection_state(settings)
    
    return {
        "is_whatsapp_active": settings.is_whatsapp_active,
        "evolution_api_url": settings.evolution_api_url,
        "evolution_api_key": settings.evolution_api_key,
        "evolution_instance_name": settings.evolution_instance_name,
        "status": status
    }

@router.patch("/whatsapp")
async def update_whatsapp_settings(data: dict, db: AsyncSession = Depends(get_db)):
    """Atualiza as configurações de WhatsApp no banco."""
    stmt = select(SystemSettings).limit(1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()

    if not settings:
        settings = SystemSettings()
        db.add(settings)

    settings.is_whatsapp_active = data.get("is_whatsapp_active", settings.is_whatsapp_active)
    settings.evolution_api_url = data.get("evolution_api_url", settings.evolution_api_url)
    settings.evolution_api_key = data.get("evolution_api_key", settings.evolution_api_key)
    settings.evolution_instance_name = data.get("evolution_instance_name", settings.evolution_instance_name)

    await db.commit()
    return {"message": "Configurações atualizadas com sucesso"}

@router.post("/whatsapp/instance")
async def create_whatsapp_instance(db: AsyncSession = Depends(get_db)):
    """Cria a instância na Evolution API."""
    stmt = select(SystemSettings).limit(1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Configurações não encontradas")
        
    success = await EvolutionApiService.create_instance(settings)
    if success:
        return {"message": "Instância criada com sucesso"}
    raise HTTPException(status_code=400, detail="Falha ao criar instância")

@router.get("/whatsapp/qrcode")
async def get_whatsapp_qrcode(db: AsyncSession = Depends(get_db)):
    """Gera/Busca o QR Code para conexão."""
    stmt = select(SystemSettings).limit(1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Configurações não encontradas")
        
    qrcode = await EvolutionApiService.get_qrcode(settings)
    if qrcode:
        return {"qrcode": qrcode}
    raise HTTPException(status_code=400, detail="Falha ao gerar QR Code")

@router.post("/whatsapp/logout")
async def logout_whatsapp_instance(db: AsyncSession = Depends(get_db)):
    """Desconecta a instância do WhatsApp."""
    stmt = select(SystemSettings).limit(1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Configurações não encontradas")
        
    success = await EvolutionApiService.logout(settings)
    if success:
        return {"message": "Desconectado com sucesso"}
    raise HTTPException(status_code=400, detail="Falha ao desconectar")
