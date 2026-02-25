from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal
from datetime import datetime

class ArtistCrewBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    role: str = Field(..., min_length=1, max_length=100)
    base_cache: Decimal = Field(default=Decimal("0.00"))
    base_diaria: Decimal = Field(default=Decimal("0.00"))
    is_active: bool = True

class ArtistCrewCreate(ArtistCrewBase):
    pass

class ArtistCrewUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    role: str | None = Field(None, min_length=1, max_length=100)
    base_cache: Decimal | None = None
    base_diaria: Decimal | None = None
    is_active: bool | None = None

class ArtistCrewResponse(ArtistCrewBase):
    id: UUID
    artist_id: UUID
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
