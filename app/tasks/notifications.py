"""
Manager Show — Tasks: Notifications (Information Push)
Este módulo é o coração do assistente virtual ativo, retirando o peso 
operacional do produtor ao automatizar a comunicação com a equipe.
"""

import logging
import uuid
from sqlalchemy import select
from app.celery_app import celery_app
from app.core.celery_utils import async_to_sync
from app.database import async_session_factory
from app.models.show import Show
from app.models.artist_crew import ArtistCrew
from app.models.show_crew import ShowCrew

logger = logging.getLogger(__name__)

@celery_app.task(name="notify_crew_about_daysheet")
@async_to_sync
async def notify_crew_about_daysheet(show_id: str, tenant_id: str):
    """
    Busca a equipe do artista vinculada ao show e simula o disparo
    de notificações com o Link Mágico do Roteiro.
    """
    logger.info(f"[Information Push] Iniciando notificações para Show {show_id} (Tenant {tenant_id})")
    
    async with async_session_factory() as db:
        try:
            # 1. Busca o Show e valida existência
            show_uuid = uuid.UUID(show_id)
            tenant_uuid = uuid.UUID(tenant_id)
            
            stmt_show = select(Show).where(Show.id == show_uuid, Show.tenant_id == tenant_uuid)
            result_show = await db.execute(stmt_show)
            show = result_show.scalar_one_or_none()
            
            if not show:
                logger.error(f"[Information Push] Erro: Show {show_id} não encontrado ou acesso negado.")
                return False

            # 2. Busca membros ativos da equipe do artista
            stmt_crew = select(ArtistCrew).where(
                ArtistCrew.artist_id == show.artist_id,
                ArtistCrew.tenant_id == tenant_uuid,
                ArtistCrew.is_active == True
            )
            result_crew = await db.execute(stmt_crew)
            crew_members = result_crew.scalars().all()
            
            if not crew_members:
                logger.warning(f"[Information Push] Nenhum membro de equipe ativo encontrado para o Artista {show.artist_id}")
                return True

            # 3. Disparo Real via WhatsApp (Information Push)
            # Retira o peso do produtor ser o "mensageiro"
            from app.services.whatsapp_service import send_whatsapp_message

            for member in crew_members:
                if not member.phone:
                    logger.warning(f"[Information Push] Membro {member.name} não possui telefone cadastrado.")
                    continue

                try:
                    # --- SMART SHARE: Vinculação de Equipe ---
                    # Garante que o membro está na tabela de rastreio para este show
                    stmt_check_assignment = select(ShowCrew).where(
                        ShowCrew.show_id == show_uuid,
                        ShowCrew.crew_member_id == member.id
                    )
                    res_assignment = await db.execute(stmt_check_assignment)
                    assignment = res_assignment.scalar_one_or_none()

                    if not assignment:
                        assignment = ShowCrew(
                            show_id=show_uuid,
                            crew_member_id=member.id,
                            tenant_id=tenant_uuid
                        )
                        db.add(assignment)
                        await db.commit()
                        await db.refresh(assignment)

                    # --- Geração do Link com Rastreador (Param 'token') ---
                    magic_link = f"https://managershow.vimasistemas.com.br/daysheet/{show_id}?token={assignment.token}"
                    
                    message = (
                        f"Olá {member.name.split()[0]}, o roteiro do show em {show.location_city} "
                        f"já está liberado! 🚀\n\nAcesse agora: {magic_link}"
                    )

                    await send_whatsapp_message(
                        phone=member.phone,
                        message=message,
                        db=db
                    )
                except Exception as e:
                    logger.error(f"[Information Push] Falha ao notificar membro via WhatsApp {member.id}: {str(e)}")

                try:
                    # --- NATIVE PUSH: Firebase Cloud Messaging ---
                    # Além do WhatsApp, envia um Push Notification para todos os Devices (FCM) logados deste membro
                    from app.models.device_token import DeviceToken
                    from app.services.fcm_service import FCMService

                    stmt_devices = select(DeviceToken.fcm_token).where(DeviceToken.user_id == member.user_id)
                    res_devices = await db.execute(stmt_devices)
                    tokens = res_devices.scalars().all()

                    if tokens:
                        # Inicializa FCM (noop se já estiver inicializado)
                        FCMService.initialize()

                        push_title = f"Roteiro Liberado: {show.location_city}"
                        push_body = f"Toque para visualizar sua passagem e hotel atualizados."
                        
                        # Disparo em massa para todos os aparelhos do músico
                        FCMService.send_multicast_notification(
                            tokens=list(tokens),
                            title=push_title,
                            body=push_body,
                            data={"show_id": str(show_id), "type": "route_published"}
                        )
                except Exception as e:
                    logger.error(f"[Information Push] Falha ao enviar Native Push (FCM) para {member.id}: {str(e)}")

            logger.info(f"[Information Push] Notificações concluídas com sucesso para o show em {show.location_city}.")
            return True

        except Exception as e:
            logger.error(f"[Information Push] Erro crítico na task: {str(e)}")
            raise e
