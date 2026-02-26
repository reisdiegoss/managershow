import uuid
from pydantic import BaseModel, HttpUrl
from typing import Optional

class SystemSettingsBase(BaseModel):
    evolution_api_url: Optional[str] = None
    evolution_api_key: Optional[str] = None
    evolution_instance_name: Optional[str] = None
    is_whatsapp_active: bool = False

class SystemSettingsUpdate(SystemSettingsBase):
    pass

class SystemSettingsResponse(SystemSettingsBase):
    id: uuid.UUID

    class Config:
        from_attributes = True
