import uuid
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TenantMixin, TimestampMixin

class FormTemplate(Base, TenantMixin, TimestampMixin):
    """
    Motor de Formulários Dinâmicos.
    Permite que cada produtora defina campos extras para processos
    como Pré-Show (Checklist) e Fechamento de Estrada.
    """
    __tablename__ = "form_templates"

    id: Mapped[uuid.UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # Ex: PRE_SHOW, ROAD_CLOSING, EXPENSE_REPORT
    
    # O schema guardará a estrutura: 
    # [{"id": "placa_van", "label": "Placa da Van", "type": "text", "required": true}]
    schema: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)

    def __repr__(self) -> str:
        return f"<FormTemplate(name={self.name}, type={self.type})>"
