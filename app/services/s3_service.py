"""
Manager Show — Service: Cloud Storage (S3 / Minio)
"""

import uuid
from pathlib import Path
from aiobotocore.session import get_session
from app.config import get_settings

settings = get_settings()

class S3Service:
    @staticmethod
    async def upload_file(file_content: bytes, filename: str, content_type: str | None = None) -> str:
        """
        Realiza o upload de um arquivo para o bucket S3 (Minio).
        Retorna a URL pública/acesso do arquivo.
        """
        session = get_session()
        async with session.create_client(
            's3',
            region_name=settings.s3_region,
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            use_ssl=settings.s3_use_ssl,
        ) as client:
            file_ext = Path(filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            
            # Realizar Upload
            await client.put_object(
                Bucket=settings.s3_bucket,
                Key=unique_filename,
                Body=file_content,
                ContentType=content_type or 'application/octet-stream'
            )
            
            # Retornar URL do arquivo (ajustada para Minio Cloud)
            return f"{settings.s3_endpoint}/{settings.s3_bucket}/{unique_filename}"

    @staticmethod
    async def delete_file(file_key: str):
        """Remove um arquivo do bucket S3."""
        session = get_session()
        async with session.create_client(
            's3',
            region_name=settings.s3_region,
            endpoint_url=settings.s3_endpoint,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            use_ssl=settings.s3_use_ssl,
        ) as client:
            await client.delete_object(Bucket=settings.s3_bucket, Key=file_key)
