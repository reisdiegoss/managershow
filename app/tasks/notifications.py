"""
Manager Show — Tasks: Notificações
"""

import time
from app.celery_app import celery_app

@celery_app.task(name="send_daysheet_notification")
def send_daysheet_notification(show_id: str, email: str):
    """
    Task assíncrona para envio de Day Sheet.
    Placeholder para integração com serviço de e-mail ou WhatsApp.
    """
    print(f"[CELERY] Iniciando disparo de Day Sheet para show {show_id}...")
    # Mock de processo pesado
    time.sleep(5)
    print(f"[CELERY] Day Sheet enviado com sucesso para {email}!")
    return {"status": "sent", "recipient": email}


@celery_app.task(name="cleanup_temp_pdfs")
def cleanup_temp_pdfs():
    """Tarefa periódica para limpar PDFs temporários (opcional)."""
    print("[CELERY] Limpando arquivos temporários...")
    return True
