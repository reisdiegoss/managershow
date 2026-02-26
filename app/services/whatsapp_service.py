import logging
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.system_settings import SystemSettings

logger = logging.getLogger(__name__)

async def send_whatsapp_message(phone: str, message: str, db: AsyncSession) -> bool:
    """
    Envia uma mensagem de WhatsApp utilizando a Evolution API configurada globalmente.
    """
    try:
        # Busca configurações globais
        stmt = select(SystemSettings).limit(1)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()

        if not settings or not settings.is_whatsapp_active:
            logger.info(f"WhatsApp inativo ou não configurado. Mensagem para {phone} não enviada.")
            return False

        if not settings.evolution_api_url or not settings.evolution_api_key or not settings.evolution_instance_name:
            logger.warning("Configurações da Evolution API incompletas.")
            return False

        # Formata o número (garante DDI 55 e apenas números)
        clean_phone = "".join(filter(str.isdigit, phone))
        if not clean_phone.startswith("55"):
            clean_phone = f"55{clean_phone}"

        url = f"{settings.evolution_api_url.rstrip('/')}/message/sendText/{settings.evolution_instance_name}"
        headers = {
            "apikey": settings.evolution_api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "number": clean_phone,
            "options": {
                "delay": 1200,
                "presence": "composing",
                "linkPreview": True
            },
            "textMessage": {
                "text": message
            }
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            
            if response.status_code in (200, 201):
                logger.info(f"Mensagem enviada com sucesso para {phone}")
                return True
            else:
                logger.error(f"Erro Evolution API ({response.status_code}): {response.text}")
                return False

    except Exception as e:
        logger.error(f"Erro grave ao enviar WhatsApp para {phone}: {str(e)}")
        # Em produção, aqui dispararíamos um alerta no Sentry
        return False
