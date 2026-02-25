"""
Manager Show — Schemas: LogisticsTimeline (Pydantic V2)
"""

import datetime as dt
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TimelineItemCreate(BaseModel):
    """Schema de criação de item na timeline do Day Sheet."""
    time: dt.time = Field(..., description="Horário no formato HH:MM")
    title: str = Field(..., min_length=2, max_length=255)
    description: str | None = None
    icon_type: str | None = Field(None, max_length=50)
    order: int = Field(0, ge=0)


class TimelineItemUpdate(BaseModel):
    """Schema de atualização parcial de item."""
    time: dt.time | None = None
    title: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None
    icon_type: str | None = None
    order: int | None = Field(None, ge=0)


class TimelineItemResponse(BaseModel):
    """Schema de resposta do item da timeline."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    show_id: UUID
    time: dt.time
    title: str
    description: str | None
    icon_type: str | None
    order: int
    
    # Novos campos (Fase 27)
    weather_temp: float | None = None
    weather_condition: str | None = None
    route_distance: str | None = None
    route_duration: str | None = None
    location_place_id: str | None = None

    created_at: dt.datetime
    updated_at: dt.datetime
