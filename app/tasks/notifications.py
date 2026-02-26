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
                    # Geração do Link Mágico (Mock) — Em produção viria do front-end
                    magic_link = f"https://app.managershow.com/public/daysheet/{show_id}"
                    
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
                    logger.error(f"[Information Push] Falha ao notificar membro {member.id}: {str(e)}")
                    continue

            logger.info(f"[Information Push] Notificações concluídas com sucesso para o show em {show.location_city}.")
            return True

        except Exception as e:
            logger.error(f"[Information Push] Erro crítico na task: {str(e)}")
            raise e
