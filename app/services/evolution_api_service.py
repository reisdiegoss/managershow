import httpx
import logging
from typing import Optional, Dict, Any
from app.models.system_settings import SystemSettings

logger = logging.getLogger(__name__)

class EvolutionApiService:
    @staticmethod
    async def get_connection_state(settings: SystemSettings) -> str:
        """
        Retorna o status da conexão da instância:
        CONNECTED, DISCONNECTED, NOT_FOUND (se não existir na API) ou ERROR.
        """
        if not settings.evolution_api_url or not settings.evolution_api_key or not settings.evolution_instance_name:
            return "NOT_CONFIGURED"

        url = f"{settings.evolution_api_url.rstrip('/')}/instance/connectionState/{settings.evolution_instance_name}"
        headers = {"apikey": settings.evolution_api_key}

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(url, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    # A Evolution API v2 retorna {"instance": {"state": "open"...}}
                    raw_state = data.get("instance", {}).get("state", "close").lower()
                    
                    if raw_state == "open":
                        return "CONNECTED"
                    elif raw_state in ("close", "connecting", "refused"):
                        return "DISCONNECTED"
                    return "DISCONNECTED"
                elif response.status_code == 404:
                    return "NOT_FOUND"
                else:
                    logger.error(f"Erro Evolution API ConnectionState ({response.status_code}): {response.text}")
                    return "ERROR"
        except httpx.TimeoutException:
            logger.warning(f"Timeout na Evolution API ao buscar status: {settings.evolution_instance_name}")
            return "ERROR"
        except Exception as e:
            logger.error(f"Falha ao consultar status na Evolution API: {str(e)}")
            return "ERROR"

    @staticmethod
    async def create_instance(settings: SystemSettings) -> bool:
        """Cria a instância na Evolution API se não existir."""
        if not settings.evolution_api_url or not settings.evolution_api_key or not settings.evolution_instance_name:
            return False

        url = f"{settings.evolution_api_url.rstrip('/')}/instance/create"
        headers = {
            "apikey": settings.evolution_api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "instanceName": settings.evolution_instance_name,
            "token": settings.evolution_api_key, # Usando a própria global apikey como token da instância para simplificar
            "qrcode": True,
            "integration": "WHATSAPP-BAILEYS"
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                if response.status_code in (200, 201):
                    logger.info(f"Instância {settings.evolution_instance_name} criada com sucesso.")
                    return True
                else:
                    logger.error(f"Erro ao criar instância ({response.status_code}): {response.text}")
                    return False
        except Exception as e:
            logger.error(f"Falha ao criar instância na Evolution API: {str(e)}")
            return False

    @staticmethod
    async def get_qrcode(settings: SystemSettings) -> Optional[str]:
        """Retorna o base64 do QR Code para conexão."""
        url = f"{settings.evolution_api_url.rstrip('/')}/instance/connect/{settings.evolution_instance_name}"
        headers = {"apikey": settings.evolution_api_key}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    # Retorna o base64 ou qrcode code
                    return data.get("base64") # Evolution v2 costuma retornar base64 diretamente
                return None
        except Exception as e:
            logger.error(f"Falha ao buscar QR Code: {str(e)}")
            return None

    @staticmethod
    async def logout(settings: SystemSettings) -> bool:
        """Desconecta a instância (Logout)."""
        url = f"{settings.evolution_api_url.rstrip('/')}/instance/logout/{settings.evolution_instance_name}"
        headers = {"apikey": settings.evolution_api_key}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.delete(url, headers=headers)
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Falha ao dar logout na instância: {str(e)}")
            return False
