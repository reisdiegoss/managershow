"""
Manager Show — Schemas: Sync (Offline-First)

Define a estrutura de dados para o protocolo de sincronização do WatermelonDB.
"""

import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class SyncEntry(BaseModel):
    """Representa uma mudança em um registro específico."""
    created: list[dict[str, Any]] = Field(default_factory=list)
    updated: list[dict[str, Any]] = Field(default_factory=list)
    deleted: list[str] = Field(default_factory=list) # IDs deletados


class SyncPushPayload(BaseModel):
    """Payload enviado pelo cliente ao servidor (Push)."""
    changes: dict[str, SyncEntry] # Tabela -> Mudanças


class SyncPullResponse(BaseModel):
    """Resposta enviada pelo servidor ao cliente (Pull)."""
    changes: dict[str, SyncEntry]
    timestamp: int # Unix timestamp do servidor
