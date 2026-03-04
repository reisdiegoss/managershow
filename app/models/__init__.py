"""
Manager Show — Registro de todos os Models SQLAlchemy

Este __init__.py importa todos os models para que o Alembic e o
SQLAlchemy possam descobrir automaticamente as tabelas ao gerar
migrações (autogenerate).

IMPORTANTE: Todo novo model criado DEVE ser importado aqui.
"""

from app.models.base import Base, TenantMixin, TimestampMixin
from app.models.tenant import Tenant, TenantStatus
from app.models.user import User
from app.models.user_artist import UserArtistAccess
from app.models.role import Role, DEFAULT_PERMISSIONS
from app.models.artist import Artist
from app.models.artist_crew import ArtistCrew
from app.models.show import (
    Show,
    ShowStatus,
    ClientType,
    NegotiationType,
)
from app.models.contractor import Contractor
from app.models.venue import Venue
from app.models.financial_transaction import (
    FinancialTransaction,
    TransactionType,
    TransactionCategory,
)
from app.models.commission import Commission, CommissionBase
from app.models.contract import Contract, ContractStatus
from app.models.logistics_timeline import LogisticsTimeline
from app.models.city_base_cost import CityBaseCost
from app.models.show_checkin import ShowCheckin
from app.models.commercial_lead import CommercialLead, CommercialLeadStatus
from app.models.seller import Seller
from app.models.contractor_note import ContractorNote
from app.models.ticket import Ticket, TicketStatus, TicketPriority, TicketReply
from app.models.saas_lead import SaaSLead, SaaSLeadStatus
from app.models.audit_log import AuditLog
from app.models.document_template import DocumentTemplate, DocumentEntityType
from app.models.system_settings import SystemSettings
from app.models.show_crew import ShowCrew
from app.models.show_execution_media import ShowExecutionMedia
from app.models.saas_payment_log import SaaSPaymentLog
from app.models.tenant_settings import TenantSettings
from app.models.saas_catalog import (
    SaaS_Bundle,
    SaaS_Addon,
    Tenant_Subscription_Log,
    AddonType,
)

__all__ = [
    "Base",
    "TenantMixin",
    "TimestampMixin",
    "Tenant",
    "TenantStatus",
    "User",
    "Role",
    "DEFAULT_PERMISSIONS",
    "Artist",
    "Show",
    "ShowStatus",
    "ClientType",
    "NegotiationType",
    "Contractor",
    "Venue",
    "FinancialTransaction",
    "TransactionType",
    "TransactionCategory",
    "Commission",
    "CommissionBase",
    "Contract",
    "ContractStatus",
    "LogisticsTimeline",
    "CityBaseCost",
    "ShowCheckin",
    "CommercialLead",
    "CommercialLeadStatus",
    "Seller",
    "ContractorNote",
    "Ticket",
    "TicketStatus",
    "TicketPriority",
    "TicketReply",
    "SaaSLead",
    "SaaSLeadStatus",
    "AuditLog",
    "DocumentTemplate",
    "DocumentEntityType",
    "SystemSettings",
    "ShowCrew",
    "ArtistCrew",
    "SaaSPaymentLog",
    "TenantSettings",
    "SaaS_Bundle",
    "SaaS_Addon",
    "Tenant_Subscription_Log",
    "AddonType",
]
