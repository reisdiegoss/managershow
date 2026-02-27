"""
Manager Show — Schemas: Plan (Pydantic V2)
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class PlanBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: str | None = None
    price: float = Field(0.0, ge=0)
    max_users: int = Field(5, ge=1)
    is_active: bool = True
    features: list[str] = Field(default_factory=list)

class PlanCreate(PlanBase):
    """Schema para criação de novos planos."""
    pass

class PlanUpdate(BaseModel):
    """Schema para atualização parcial de planos."""
    name: str | None = Field(None, min_length=2, max_length=100)
    description: str | None = None
    price: float | None = Field(None, ge=0)
    max_users: int | None = Field(None, ge=1)
    is_active: bool | None = None
    features: list[str] | None = None

class PlanResponse(PlanBase):
    """Schema de resposta completa do plano."""
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    updated_at: datetime
