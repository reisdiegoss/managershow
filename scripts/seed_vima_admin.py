"""
Manager Show — Seed: Super Admin (Vima Sistemas) [ISOLATED CORE VERSION]

Este script utiliza SQLAlchemy Core SEM carregar modelos ORM para evitar erros de inicialização.
Garante:
- Tenant 'Vima Sistemas'
- Role 'Super Admin Global'
- Usuário 'contato@vimasistemas.com.br'
"""

import uuid
from sqlalchemy import create_engine, MetaData, Table, select, insert, func
from app.config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url_sync)
metadata = MetaData()

# Definição das tabelas
tenants = Table("tenants", metadata, autoload_with=engine)
roles = Table("roles", metadata, autoload_with=engine)
users = Table("users", metadata, autoload_with=engine)

# Permissões padrão extraídas de app/models/role.py para isolamento total
ISOLATED_DEFAULT_PERMISSIONS = {
    "can_view_financials": True,
    "can_view_dre": True,
    "can_manage_commissions": True,
    "can_approve_contracts": True,
    "can_generate_contracts": True,
    "can_create_shows": True,
    "can_edit_shows": True,
    "can_delete_shows": True,
    "can_simulate_shows": True,
    "can_add_expenses": True,
    "can_manage_daysheet": True,
    "can_close_road": True,
    "can_checkin_crew": True,
    "can_add_extra_expenses": True,
    "can_manage_users": True,
    "can_manage_roles": True,
    "can_manage_artists": True,
    "can_manage_contractors": True,
    "is_admin": True,
}

def seed_vima_admin():
    print("\n🚀 Iniciando Setup do Super Admin (Vima Sistemas) - Modo Isolado...\n")
    
    with engine.connect() as conn:
        # 1. Tenant
        stmt_tenant_sel = select(tenants).where(tenants.c.name == "Vima Sistemas")
        tenant = conn.execute(stmt_tenant_sel).mappings().first()
        
        now = conn.execute(select(func.now())).scalar()

        if not tenant:
            tenant_id = uuid.uuid4()
            conn.execute(insert(tenants).values(
                id=tenant_id,
                name="Vima Sistemas",
                document="00.000.000/0001-00",
                email="contato@vimasistemas.com.br",
                status="ACTIVE",
                max_users=999,
                created_at=now,
                updated_at=now
            ))
            conn.commit()
            print(f"✅ Tenant 'Vima Sistemas' criado.")
            tenant = conn.execute(stmt_tenant_sel).mappings().first()
        else:
            print(f"ℹ️ Tenant já existe.")

        # 2. Role
        tenant_id = tenant['id']
        stmt_role_sel = select(roles).where(roles.c.tenant_id == tenant_id, roles.c.name == "Super Admin Global")
        role = conn.execute(stmt_role_sel).mappings().first()
        
        if not role:
            role_id = uuid.uuid4()
            conn.execute(insert(roles).values(
                id=role_id,
                tenant_id=tenant_id,
                name="Super Admin Global",
                description="Perfil mestre do SaaS — Acesso total",
                permissions=ISOLATED_DEFAULT_PERMISSIONS,
                created_at=now,
                updated_at=now
            ))
            conn.commit()
            print(f"✅ Role 'Super Admin Global' criada.")
            role = conn.execute(stmt_role_sel).mappings().first()
        else:
            print(f"ℹ️ Role já existe.")

        # 3. User
        role_id = role['id']
        stmt_user_sel = select(users).where(users.c.email == "contato@vimasistemas.com.br")
        user = conn.execute(stmt_user_sel).mappings().first()
        
        if not user:
            user_id = uuid.uuid4()
            conn.execute(insert(users).values(
                id=user_id,
                tenant_id=tenant_id,
                role_id=role_id,
                clerk_id="clerk_vima_admin_001", # Para sincronizar com Clerk depois
                email="contato@vimasistemas.com.br",
                name="Admin Vima Sistemas",
                is_active=True,
                created_at=now,
                updated_at=now
            ))
            conn.commit()
            print(f"✅ Usuário 'contato@vimasistemas.com.br' criado!")
            print(f"🔑 ID Interno: {user_id}")
        else:
            print(f"ℹ️ Usuário já existe.")

        conn.commit()
    
    print("\n🏁 Setup concluído!")

if __name__ == "__main__":
    seed_vima_admin()
