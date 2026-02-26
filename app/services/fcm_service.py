import firebase_admin
from firebase_admin import credentials, messaging
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class FCMService:
    """
    Manager Show — Firebase Cloud Messaging Service
    
    Responsável pelo envio de Push Notifications (Nativo) para os dispositivos móveis.
    Inicializa em modo dry_run se as credenciais originais não existirem para ambiente local.
    """
    _initialized = False

    @classmethod
    def initialize(cls):
        """Inicializa o app do Firebase Admin com o arquivo de credenciais sa-key."""
        if not cls._initialized:
            try:
                # Caso a Key venha via path pelo Env, injeta no SDK
                if settings.FIREBASE_SERVICE_ACCOUNT_PATH:
                    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
                    firebase_admin.initialize_app(cred)
                    cls._initialized = True
                    logger.info("FCM Service: Initialized successfully with credentials.")
                else:
                    logger.warning("FCM Service: FIREBASE_SERVICE_ACCOUNT_PATH not found. Push notifications will only run in dry_run mocked mode.")
            except Exception as e:
                logger.error(f"FCM Service: Failed to initialize Firebase App: {e}")

    @classmethod
    def send_push_notification(cls, token: str, title: str, body: str, data: dict = None, dry_run: bool = False):
        """
        Envia uma notificação Push via FCM para um único token específico.
        
        Args:
            token: String do token recebido pelo cliente móvel/navegador
            title: Título legível do Push
            body: Mensagem principal (ex: 'Roteiro Aberto: Jorge e Mateus')
            data: Dicionário estático para uso de Deep Linking na Activity/Schema (Opcional)
            dry_run: Se True, apenas simula o dispatch sem enviar requisição externa
        """
        if not cls._initialized and not dry_run:
            logger.error("FCM Service: Cannot send push. Firebase is not initialized.")
            return None

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )

        try:
            # Envia a notificação
            response = messaging.send(message, dry_run=dry_run)
            logger.info(f"FCM Service: Push sent successfully. ID: {response}")
            return response
        except Exception as e:
            logger.error(f"FCM Service: Error sending Push message: {e}")
            return None

    @classmethod
    def send_multicast_notification(cls, tokens: list[str], title: str, body: str, data: dict = None, dry_run: bool = False):
        """Dispara um Push de forma otimizada para várias pessoas ao mesmo tempo."""
        if not tokens:
            return None
            
        if not cls._initialized and not dry_run:
            logger.error("FCM Service: Cannot send multicast push. Firebase is not initialized.")
            return None

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )

        try:
            response = messaging.send_multicast(message, dry_run=dry_run)
            logger.info(f"FCM Service: Multicast Push sent. Target {len(tokens)} devices. Success: {response.success_count}, Failure: {response.failure_count}")
            return response
        except Exception as e:
            logger.error(f"FCM Service: Error sending Multicast Push message: {e}")
            return None
