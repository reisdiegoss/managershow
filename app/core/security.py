"""
Manager Show — Core: Segurança de Arquivos (Upload Shield)
"""

import magic
from fastapi import HTTPException, UploadFile

# Configurações de Segurança
ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
}

MAX_FILE_SIZE_RECIBO = 5 * 1024 * 1024  # 5MB
MAX_FILE_SIZE_CONTRATO = 10 * 1024 * 1024  # 10MB

def validate_upload(file_file: UploadFile, max_size: int):
    """
    Valida um arquivo UploadFile por:
    1. Tamanho do buffer.
    2. MIME Type via Magic Bytes (mais seguro que extensão).
    """
    # 1. Validar Tamanho
    file_file.file.seek(0, 2)  # Mover para o final
    size = file_file.file.tell()
    file_file.file.seek(0)  # Voltar para o início
    
    if size > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Limite máximo permitido: {max_size // (1024*1024)}MB."
        )

    # 2. Validar MIME Type via Magic Bytes
    header = file_file.file.read(2048)
    file_file.file.seek(0)
    
    mime_type = magic.from_buffer(header, mime=True)
    
    if mime_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de arquivo não permitido ({mime_type}). Use PDF, JPG ou PNG."
        )
    
    return True
