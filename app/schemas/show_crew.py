import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ShowCrewBase(BaseModel):
    show_id: uuid.UUID
    crew_member_id: uuid.UUID
    read_receipt: bool = False
    read_at: datetime | None = None

class ShowCrewCreate(BaseModel):
    show_id: uuid.UUID
    crew_member_id: uuid.UUID

class ShowCrewResponse(ShowCrewBase):
    id: uuid.UUID
    member_name: str | None = None
    member_role: str | None = None

    model_config = ConfigDict(from_attributes=True)

class ReadReceiptUpdate(BaseModel):
    show_id: uuid.UUID
    member_id: uuid.UUID
