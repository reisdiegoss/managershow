"""
Missão Torre de Controle - v0.7.0
Refatoração da tabela Tenants e criação de SaaS CRM/Helpdesk/Audit.

Revision ID: control_tower_001
Revises: 
Create Date: 2026-02-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # 1. Upgrade Tenants table
    op.add_column('tenants', sa.Column('cnpj', sa.String(20), unique=True, nullable=True))
    op.add_column('tenants', sa.Column('address', sa.String(500), nullable=True))
    op.add_column('tenants', sa.Column('contact_name', sa.String(255), nullable=True))
    op.add_column('tenants', sa.Column('contact_phone', sa.String(20), nullable=True))
    op.add_column('tenants', sa.Column('plan_type', sa.String(50), server_default='Essencial', nullable=False))
    op.add_column('tenants', sa.Column('feature_toggles', postgresql.JSONB, server_default='{}', nullable=False))
    op.add_column('tenants', sa.Column('max_storage_gb', sa.Integer, server_default='10', nullable=False))
    op.add_column('tenants', sa.Column('is_suspended', sa.Boolean, server_default='false', nullable=False))

    # 2. Create saas_leads table
    op.create_table(
        'saas_leads',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('agency_name', sa.String(255), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

    # 3. Create support_tickets table (Se não existir, usando o model unificado)
    # Nota: O model 'tickets' já existia, ajustamos apenas se necessário.
    
    # 4. Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('admin_id', sa.String(255), nullable=False),
        sa.Column('action', sa.String(255), nullable=False),
        sa.Column('target_id', sa.String(255), nullable=True),
        sa.Column('details', postgresql.JSONB, server_default='{}', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
    )

def downgrade():
    op.drop_table('audit_logs')
    op.drop_table('saas_leads')
    op.drop_column('tenants', 'is_suspended')
    op.drop_column('tenants', 'max_storage_gb')
    op.drop_column('tenants', 'feature_toggles')
    op.drop_column('tenants', 'plan_type')
    op.drop_column('tenants', 'contact_phone')
    op.drop_column('tenants', 'contact_name')
    op.drop_column('tenants', 'address')
    op.drop_column('tenants', 'cnpj')
