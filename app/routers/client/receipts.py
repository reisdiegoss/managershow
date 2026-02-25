"""
Manager Show — Router: Expense Receipts (Módulo 5/Fase 28)

Gerencia o upload de fotos/arquivos de recibos para o S3.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from app.core.dependencies import CurrentUser, DbSession
from app.services.s3_service import S3Service

router = APIRouter(prefix="/receipts", tags=["Client — Receipts"])

@router.post("/upload", status_code=201)
async def upload_receipt(
    file: UploadFile = File(...),
    current_user: CurrentUser = None,
):
    """
    Upload de recibo para o S3.
    Retorna a URL pública do arquivo para ser salva na transação.
    """
    # 1. Validar Tipo de Arquivo
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Formato de arquivo não suportado. Use JPG, PNG ou PDF.")

    # 2. Ler conteúdo e fazer upload
    try:
        content = await file.read()
        file_url = await S3Service.upload_file(
            file_content=content,
            filename=file.filename,
            content_type=file.content_type
        )
        return {"url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao fazer upload do arquivo: {str(e)}")
