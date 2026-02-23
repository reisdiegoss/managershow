"""
Manager Show — Schemas: Ticket / Help Desk (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.ticket import TicketPriority, TicketStatus


class TicketCreate(BaseModel):
    """Schema de criação de ticket de suporte."""
    subject: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=10)
    priority: TicketPriority = TicketPriority.MEDIA
    category: str | None = Field(None, max_length=100)


class TicketUpdate(BaseModel):
    """Schema de atualização parcial de ticket."""
    subject: str | None = Field(None, min_length=2, max_length=255)
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    category: str | None = None


class TicketResponse(BaseModel):
    """Schema de resposta do ticket."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    user_id: UUID | None
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    category: str | None
    created_at: datetime
    updated_at: datetime


class TicketReplyCreate(BaseModel):
    """Schema de criação de resposta a ticket."""
    content: str = Field(..., min_length=1)
    author_name: str = Field(..., max_length=255)
    is_internal: bool = False


class TicketReplyResponse(BaseModel):
    """Schema de resposta da reply."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    ticket_id: UUID
    author_name: str
    content: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime
