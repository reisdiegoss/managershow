import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class DeviceToken(Base):
    """
    Manager Show — Firebase Device Token
    
    Tabela polimórfica para armazenar os tokens FCM (Firebase Cloud Messaging) de usuários e/ou equipe (ShowCrew).
    Usada para disparo de Push Notifications de acordos fechados, alterações de passagem e diárias.
    """
    __tablename__ = "device_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # ForeignKey (Opcionais pois pode pertencer a um Usuário Painel Administrativo ou um Membro da Equipe de Estrada)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    crew_member_id = Column(UUID(as_uuid=True), ForeignKey("show_crews.id", ondelete="CASCADE"), nullable=True, index=True)

    # Identificação do Device e Token FCM
    fcm_token = Column(String, nullable=False, unique=True, index=True)
    platform = Column(String, nullable=True) # "ios", "android", "web"
    device_name = Column(String, nullable=True) # Nome amigável do celular (ex: iPhone do João)
    
    # Controle
    last_active = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    tenant = relationship("Tenant")
    user = relationship("User")
    crew_member = relationship("ShowCrew")
