from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Any

class FormFieldSchema(BaseModel):
    id: str
    label: str
    type: str # text, number, date, select, file
    required: bool = False
    options: list[str] | None = None # Para tipo select

class FormTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=50)
    schema: list[FormFieldSchema] = Field(default_factory=list)

class FormTemplateCreate(FormTemplateBase):
    pass

class FormTemplateUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    type: str | None = Field(None, min_length=1, max_length=50)
    schema: list[FormFieldSchema] | None = None

class FormTemplateResponse(FormTemplateBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
