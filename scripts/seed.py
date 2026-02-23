"""
Manager Show — Database Seeding Completo

EXIGÊNCIA ABSOLUTA: Popular o PostgreSQL de forma que a API seja
100% testável via Swagger/Redoc sem frontend.

Este script cria:
1. 2 Tenants (Escritório A e Escritório B)
2. Roles (Admin, Produtor, Vendedor, Músico) por tenant
3. Usuários mockados associados aos tenants e roles
4. Artistas por tenant
5. Cidades base com histórico de custos (voos e hotéis)
6. Contratantes e locais
7. 1 Show completo passando por todas as 6 etapas:
   - Show criado (Etapa 1)
   - Contrato validado (Etapa 2 — destrava Etapa 3)
   - Custos lançados (Etapa 3)
   - Timeline do Day Sheet (Etapa 4)
   - Check-in realizado + extras (Etapa 5)
   - DRE calculável (Etapa 6)

Execução:
    python -m scripts.seed
"""

import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.artist import Artist
from app.models.base import Base
from app.models.city_base_cost import CityBaseCost
from app.models.commission import Commission, CommissionBase
from app.models.contract import Contract, ContractStatus
from app.models.contractor import Contractor
from app.models.financial_transaction import (
    FinancialTransaction,
    TransactionCategory,
    TransactionType,
)
from app.models.logistics_timeline import LogisticsTimeline
from app.models.role import DEFAULT_PERMISSIONS, Role
from app.models.show import ClientType, NegotiationType, Show, ShowStatus
from app.models.show_checkin import ShowCheckin
from app.models.tenant import Tenant, TenantStatus
from app.models.user import User
from app.models.venue import Venue

settings = get_settings()

# Engine síncrono para seed (não precisa de async aqui)
engine = create_engine(
    settings.database_url_sync,
    echo=True,
)


def seed() -> None:
    """Executa o seeding completo do banco de dados."""
    print("\n🌱 Iniciando Database Seeding do Manager Show...\n")

    # Criar todas as tabelas (caso não existam)
    Base.metadata.create_all(engine)
    print("✅ Tabelas criadas/verificadas com sucesso.\n")

    with Session(engine) as session:
        # =====================================================================
        # 1. TENANTS
        # =====================================================================
        print("📦 Criando Tenants...")

        tenant_a_id = uuid.uuid4()
        tenant_b_id = uuid.uuid4()

        tenant_a = Tenant(
            id=tenant_a_id,
            name="Escritório Show Business Ltda",
            document="12.345.678/0001-90",
            email="contato@showbusiness.com.br",
            phone="(11) 99999-0001",
            status=TenantStatus.ACTIVE,
            max_users=10,
            subscription_expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        tenant_b = Tenant(
            id=tenant_b_id,
            name="Agência Hit Produções",
            document="98.765.432/0001-10",
            email="contato@hitproducoes.com.br",
            phone="(21) 99999-0002",
            status=TenantStatus.ACTIVE,
            max_users=5,
            subscription_expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
        session.add_all([tenant_a, tenant_b])
        session.flush()
        print(f"   ✅ Tenant A: {tenant_a.name} (ID: {tenant_a_id})")
        print(f"   ✅ Tenant B: {tenant_b.name} (ID: {tenant_b_id})")

        # =====================================================================
        # 2. ROLES (Perfis de Permissão)
        # =====================================================================
        print("\n🔐 Criando Roles...")

        # Admin — tudo liberado
        admin_perms = {**DEFAULT_PERMISSIONS, "is_admin": True}
        for key in admin_perms:
            admin_perms[key] = True

        # Produtor — pode gerenciar shows, despesas, roteiros
        produtor_perms = {
            **DEFAULT_PERMISSIONS,
            "can_create_shows": True,
            "can_edit_shows": True,
            "can_simulate_shows": True,
            "can_add_expenses": True,
            "can_manage_daysheet": True,
            "can_close_road": True,
            "can_checkin_crew": True,
            "can_add_extra_expenses": True,
            "can_view_financials": True,
            "can_view_dre": True,
            "can_generate_contracts": True,
        }

        # Vendedor — pode criar shows e simular
        vendedor_perms = {
            **DEFAULT_PERMISSIONS,
            "can_create_shows": True,
            "can_edit_shows": True,
            "can_simulate_shows": True,
            "can_generate_contracts": True,
        }

        # Músico — apenas visualização do roteiro (sem financeiro)
        musico_perms = {**DEFAULT_PERMISSIONS}

        roles_data = {
            "admin_a": Role(id=uuid.uuid4(), tenant_id=tenant_a_id, name="Admin", description="Administrador do escritório — acesso total", permissions=admin_perms),
            "produtor_a": Role(id=uuid.uuid4(), tenant_id=tenant_a_id, name="Produtor", description="Produção e logística de shows", permissions=produtor_perms),
            "vendedor_a": Role(id=uuid.uuid4(), tenant_id=tenant_a_id, name="Vendedor", description="Comercial — criação e simulação de shows", permissions=vendedor_perms),
            "musico_a": Role(id=uuid.uuid4(), tenant_id=tenant_a_id, name="Músico", description="Visualização de roteiros (sem acesso financeiro)", permissions=musico_perms),
            "admin_b": Role(id=uuid.uuid4(), tenant_id=tenant_b_id, name="Admin", description="Administrador da agência", permissions=admin_perms),
            "produtor_b": Role(id=uuid.uuid4(), tenant_id=tenant_b_id, name="Produtor", description="Produção e logística", permissions=produtor_perms),
        }
        session.add_all(roles_data.values())
        session.flush()
        for key, role in roles_data.items():
            print(f"   ✅ Role: {role.name} ({key}) — ID: {role.id}")

        # =====================================================================
        # 3. USUÁRIOS
        # =====================================================================
        print("\n👤 Criando Usuários...")

        users_data = {
            "admin_user_a": User(
                id=uuid.uuid4(), tenant_id=tenant_a_id,
                clerk_id="clerk_admin_a_001",
                email="admin@showbusiness.com.br", name="Carlos Silva (Admin)",
                role_id=roles_data["admin_a"].id, is_active=True,
            ),
            "produtor_user_a": User(
                id=uuid.uuid4(), tenant_id=tenant_a_id,
                clerk_id="clerk_produtor_a_001",
                email="produtor@showbusiness.com.br", name="João Produção",
                role_id=roles_data["produtor_a"].id, is_active=True,
            ),
            "vendedor_user_a": User(
                id=uuid.uuid4(), tenant_id=tenant_a_id,
                clerk_id="clerk_vendedor_a_001",
                email="vendedor@showbusiness.com.br", name="Ana Vendas",
                role_id=roles_data["vendedor_a"].id, is_active=True,
            ),
            "musico_user_a": User(
                id=uuid.uuid4(), tenant_id=tenant_a_id,
                clerk_id="clerk_musico_a_001",
                email="musico@showbusiness.com.br", name="Pedro Guitarrista",
                role_id=roles_data["musico_a"].id, is_active=True,
            ),
            "admin_user_b": User(
                id=uuid.uuid4(), tenant_id=tenant_b_id,
                clerk_id="clerk_admin_b_001",
                email="admin@hitproducoes.com.br", name="Maria Souza (Admin B)",
                role_id=roles_data["admin_b"].id, is_active=True,
            ),
            "produtor_user_b": User(
                id=uuid.uuid4(), tenant_id=tenant_b_id,
                clerk_id="clerk_produtor_b_001",
                email="produtor@hitproducoes.com.br", name="Roberto Produtor B",
                role_id=roles_data["produtor_b"].id, is_active=True,
            ),
        }
        session.add_all(users_data.values())
        session.flush()
        for key, user in users_data.items():
            print(f"   ✅ Usuário: {user.name} ({key}) — ID: {user.id}")

        # =====================================================================
        # 4. ARTISTAS
        # =====================================================================
        print("\n🎵 Criando Artistas...")

        artist_a1 = Artist(
            id=uuid.uuid4(), tenant_id=tenant_a_id,
            name="João & Maria (Sertanejo)",
            legal_name="JM Produções Artísticas Ltda",
            document="11.222.333/0001-44", genre="Sertanejo",
            bio="Dupla sertaneja com 5 álbuns gravados.",
        )
        artist_a2 = Artist(
            id=uuid.uuid4(), tenant_id=tenant_a_id,
            name="MC Trovão (Funk)",
            legal_name="Trovão Music Eireli",
            document="55.666.777/0001-88", genre="Funk",
        )
        artist_b1 = Artist(
            id=uuid.uuid4(), tenant_id=tenant_b_id,
            name="Banda Maré Alta (Pagode)",
            legal_name="Maré Alta Show Ltda",
            document="99.888.777/0001-66", genre="Pagode",
        )
        session.add_all([artist_a1, artist_a2, artist_b1])
        session.flush()
        print(f"   ✅ Artista: {artist_a1.name} — ID: {artist_a1.id}")
        print(f"   ✅ Artista: {artist_a2.name} — ID: {artist_a2.id}")
        print(f"   ✅ Artista: {artist_b1.name} — ID: {artist_b1.id}")

        # =====================================================================
        # 5. CONTRATANTES E LOCAIS
        # =====================================================================
        print("\n🏢 Criando Contratantes e Locais...")

        contractor1 = Contractor(
            id=uuid.uuid4(), tenant_id=tenant_a_id,
            name="Prefeitura de Caruaru",
            document="10.000.000/0001-01",
            city="Caruaru", uf="PE",
            phone="(81) 3721-0000",
        )
        contractor2 = Contractor(
            id=uuid.uuid4(), tenant_id=tenant_a_id,
            name="Casa de Eventos Sunset",
            document="20.000.000/0001-02",
            email="contato@sunset.com.br",
            city="São Paulo", uf="SP",
        )
        session.add_all([contractor1, contractor2])

        venue1 = Venue(
            id=uuid.uuid4(), tenant_id=tenant_a_id,
            name="Pátio de Eventos de Caruaru",
            city="Caruaru", uf="PE",
            address="Centro de Caruaru, PE",
            capacity=50000,
        )
        venue2 = Venue(
            id=uuid.uuid4(), tenant_id=tenant_a_id,
            name="Casa Sunset SP",
            city="São Paulo", uf="SP",
            address="Rua Augusta, 1000 - Consolação",
            capacity=3000,
        )
        session.add_all([venue1, venue2])
        session.flush()

        # =====================================================================
        # 6. HISTÓRICO DE CUSTOS POR CIDADE (Alimenta o Simulador)
        # =====================================================================
        print("\n📊 Criando Histórico de Custos...")

        cost_data = [
            # Caruaru - PE
            CityBaseCost(tenant_id=tenant_a_id, city="Caruaru", uf="PE", category="FLIGHT", cost_amount=Decimal("1200.00"), reference_date=date.today() - timedelta(days=30)),
            CityBaseCost(tenant_id=tenant_a_id, city="Caruaru", uf="PE", category="FLIGHT", cost_amount=Decimal("1350.00"), reference_date=date.today() - timedelta(days=90)),
            CityBaseCost(tenant_id=tenant_a_id, city="Caruaru", uf="PE", category="FLIGHT", cost_amount=Decimal("1100.00"), reference_date=date.today() - timedelta(days=180)),
            CityBaseCost(tenant_id=tenant_a_id, city="Caruaru", uf="PE", category="HOTEL", cost_amount=Decimal("350.00"), reference_date=date.today() - timedelta(days=30)),
            CityBaseCost(tenant_id=tenant_a_id, city="Caruaru", uf="PE", category="HOTEL", cost_amount=Decimal("400.00"), reference_date=date.today() - timedelta(days=90)),
            CityBaseCost(tenant_id=tenant_a_id, city="Caruaru", uf="PE", category="HOTEL", cost_amount=Decimal("320.00"), reference_date=date.today() - timedelta(days=180)),
            # São Paulo - SP
            CityBaseCost(tenant_id=tenant_a_id, city="São Paulo", uf="SP", category="FLIGHT", cost_amount=Decimal("800.00"), reference_date=date.today() - timedelta(days=30)),
            CityBaseCost(tenant_id=tenant_a_id, city="São Paulo", uf="SP", category="HOTEL", cost_amount=Decimal("500.00"), reference_date=date.today() - timedelta(days=30)),
            CityBaseCost(tenant_id=tenant_a_id, city="São Paulo", uf="SP", category="VAN_TRANSFER", cost_amount=Decimal("200.00"), reference_date=date.today() - timedelta(days=30)),
        ]
        session.add_all(cost_data)
        session.flush()
        print("   ✅ Custos registrados para Caruaru/PE e São Paulo/SP")

        # =====================================================================
        # 7. SHOW COMPLETO — TODAS AS 6 ETAPAS
        # =====================================================================
        print("\n🎪 Criando Show Completo (6 Etapas)...")

        show_id = uuid.uuid4()
        show_date = date.today() + timedelta(days=15)

        # --- ETAPA 1: Criação do Show (Público/Prefeitura) ---
        show = Show(
            id=show_id,
            tenant_id=tenant_a_id,
            artist_id=artist_a1.id,
            contractor_id=contractor1.id,
            venue_id=venue1.id,
            status=ShowStatus.CONCLUIDO,  # Já passou por todas as etapas
            client_type=ClientType.PUBLIC,
            negotiation_type=NegotiationType.COLOCADO_TOTAL,
            date_show=show_date,
            location_city="Caruaru",
            location_uf="PE",
            location_venue_name="Pátio de Eventos de Caruaru",
            base_price=Decimal("200000.00"),   # Valor de Face (Nota)
            real_cache=Decimal("180000.00"),    # Cachê Real
            production_kickback=Decimal("20000.00"),  # Retorno (NUNCA é lucro)
            tax_percentage=Decimal("8.5"),     # ISS + IRRF
            contract_validated=True,
            contract_validated_at=datetime.now(timezone.utc) - timedelta(days=10),
            contract_validated_by=users_data["admin_user_a"].id,
            road_closed=True,
            road_closed_at=datetime.now(timezone.utc) - timedelta(days=1),
            notes="Show do São João de Caruaru — Palco Principal",
        )
        session.add(show)
        session.flush()
        print(f"   ✅ Show criado: {show.location_city}/{show.location_uf} — R$ {show.base_price}")

        # --- ETAPA 2: Contrato Validado ---
        contract = Contract(
            tenant_id=tenant_a_id,
            show_id=show_id,
            status=ContractStatus.SIGNED,
            title="Contrato de Apresentação — São João Caruaru 2026",
            content="Contrato de prestação de serviços artísticos...",
            signed_by="Sec. de Cultura de Caruaru",
        )
        session.add(contract)
        print("   ✅ Contrato ASSINADO")

        # --- ETAPA 3: Custos Lançados (Produção + Colocação) ---
        financial_data = [
            # Custos de Produção
            FinancialTransaction(
                tenant_id=tenant_a_id, show_id=show_id,
                type=TransactionType.PRODUCTION_COST,
                category=TransactionCategory.CREW_PAYMENT,
                description="Folha de músicos (6 pessoas)",
                budgeted_amount=Decimal("12000.00"),
                realized_amount=Decimal("12000.00"),
            ),
            FinancialTransaction(
                tenant_id=tenant_a_id, show_id=show_id,
                type=TransactionType.PRODUCTION_COST,
                category=TransactionCategory.BACKLINE,
                description="Locação de backline completo",
                budgeted_amount=Decimal("3000.00"),
                realized_amount=Decimal("3500.00"),  # Estouro de orçamento!
            ),
            FinancialTransaction(
                tenant_id=tenant_a_id, show_id=show_id,
                type=TransactionType.PRODUCTION_COST,
                category=TransactionCategory.SOUND_LIGHT,
                description="Técnico de som + iluminação",
                budgeted_amount=Decimal("2000.00"),
                realized_amount=Decimal("2000.00"),
            ),
            # Custos de Colocação (Logística)
            FinancialTransaction(
                tenant_id=tenant_a_id, show_id=show_id,
                type=TransactionType.LOGISTICS_COST,
                category=TransactionCategory.FLIGHT,
                description="Passagens aéreas (8 pessoas) GRU→REC",
                budgeted_amount=Decimal("12000.00"),
                realized_amount=Decimal("11500.00"),
            ),
            FinancialTransaction(
                tenant_id=tenant_a_id, show_id=show_id,
                type=TransactionType.LOGISTICS_COST,
                category=TransactionCategory.HOTEL,
                description="Hotel 2 noites (4 quartos)",
                budgeted_amount=Decimal("3200.00"),
                realized_amount=Decimal("3200.00"),
            ),
            FinancialTransaction(
                tenant_id=tenant_a_id, show_id=show_id,
                type=TransactionType.LOGISTICS_COST,
                category=TransactionCategory.VAN_TRANSFER,
                description="Transfer Aeroporto→Hotel→Local→Aeroporto",
                budgeted_amount=Decimal("1500.00"),
                realized_amount=Decimal("1800.00"),  # Estouro de orçamento!
            ),
            FinancialTransaction(
                tenant_id=tenant_a_id, show_id=show_id,
                type=TransactionType.LOGISTICS_COST,
                category=TransactionCategory.MEALS,
                description="Alimentação equipe (2 dias)",
                budgeted_amount=Decimal("1200.00"),
                realized_amount=Decimal("1100.00"),
            ),
        ]
        session.add_all(financial_data)
        print("   ✅ Custos lançados (Produção + Colocação)")

        # --- Despesa Extra (Etapa 5) ---
        extra_expense = FinancialTransaction(
            tenant_id=tenant_a_id, show_id=show_id,
            type=TransactionType.EXTRA_EXPENSE,
            category=TransactionCategory.OTHER,
            description="Corda de violão quebrada + emergência",
            budgeted_amount=Decimal("0"),
            realized_amount=Decimal("250.00"),
        )
        session.add(extra_expense)
        print("   ✅ Despesa extra lançada (Etapa 5)")

        # --- COMISSÕES ---
        commissions_data = [
            # Comissão do intermediário (sobre o BRUTO)
            Commission(
                tenant_id=tenant_a_id, show_id=show_id,
                beneficiary_name="Promoter João Local",
                commission_base=CommissionBase.GROSS,
                percentage=Decimal("5.00"),  # 5% sobre o Valor de Face
            ),
            # Comissão do escritório (sobre o LÍQUIDO)
            Commission(
                tenant_id=tenant_a_id, show_id=show_id,
                beneficiary_name="Escritório Show Business Ltda",
                commission_base=CommissionBase.NET,
                percentage=Decimal("15.00"),  # 15% sobre o Lucro Líquido
            ),
            # Comissão do vendedor (sobre o BRUTO)
            Commission(
                tenant_id=tenant_a_id, show_id=show_id,
                user_id=users_data["vendedor_user_a"].id,
                beneficiary_name="Ana Vendas",
                commission_base=CommissionBase.GROSS,
                percentage=Decimal("3.00"),  # 3% sobre o Valor de Face
            ),
        ]
        session.add_all(commissions_data)
        print("   ✅ Comissões registradas (GROSS + NET)")

        # --- ETAPA 4: Timeline do Day Sheet ---
        timeline_data = [
            LogisticsTimeline(
                tenant_id=tenant_a_id, show_id=show_id,
                time=time(7, 0), title="Saída para o Aeroporto",
                description="Van sai do escritório SP", icon_type="van", order=1,
            ),
            LogisticsTimeline(
                tenant_id=tenant_a_id, show_id=show_id,
                time=time(9, 30), title="Voo GRU → REC",
                description="Voo LATAM LA3421", icon_type="flight", order=2,
            ),
            LogisticsTimeline(
                tenant_id=tenant_a_id, show_id=show_id,
                time=time(13, 0), title="Chegada ao Hotel",
                description="Hotel Caruaru Palace — Check-in", icon_type="hotel", order=3,
            ),
            LogisticsTimeline(
                tenant_id=tenant_a_id, show_id=show_id,
                time=time(16, 0), title="Passagem de Som",
                description="Pátio de Eventos — Palco Principal", icon_type="soundcheck", order=4,
            ),
            LogisticsTimeline(
                tenant_id=tenant_a_id, show_id=show_id,
                time=time(22, 0), title="SHOW",
                description="Apresentação ao vivo — Palco Principal", icon_type="show", order=5,
            ),
            LogisticsTimeline(
                tenant_id=tenant_a_id, show_id=show_id,
                time=time(0, 30), title="Retorno ao Hotel",
                description="Transfer de volta", icon_type="van", order=6,
            ),
        ]
        session.add_all(timeline_data)
        print("   ✅ Day Sheet (Timeline) criado")

        # --- ETAPA 5: Check-in da Equipe ---
        checkin_data = [
            ShowCheckin(tenant_id=tenant_a_id, show_id=show_id, user_id=users_data["produtor_user_a"].id),
            ShowCheckin(tenant_id=tenant_a_id, show_id=show_id, user_id=users_data["musico_user_a"].id),
            ShowCheckin(tenant_id=tenant_a_id, show_id=show_id, user_id=users_data["vendedor_user_a"].id),
        ]
        session.add_all(checkin_data)
        print("   ✅ Check-in da equipe realizado (3 pessoas)")

        # =====================================================================
        # 8. SHOW PRIVADO SIMPLES (Escritório A — apenas Etapa 1)
        # =====================================================================
        show_privado = Show(
            tenant_id=tenant_a_id,
            artist_id=artist_a1.id,
            contractor_id=contractor2.id,
            venue_id=venue2.id,
            status=ShowStatus.SONDAGEM,
            client_type=ClientType.PRIVATE,
            negotiation_type=NegotiationType.CACHE_DESPESAS,
            date_show=date.today() + timedelta(days=45),
            location_city="São Paulo",
            location_uf="SP",
            location_venue_name="Casa Sunset SP",
            base_price=Decimal("80000.00"),
            real_cache=Decimal("80000.00"),
            production_kickback=Decimal("0"),
            tax_percentage=Decimal("5.00"),
            notes="Show privado na Casa Sunset — ainda em sondagem",
        )
        session.add(show_privado)

        # =====================================================================
        # 9. SHOW DO TENANT B (isolamento multi-tenant)
        # =====================================================================
        show_b = Show(
            tenant_id=tenant_b_id,
            artist_id=artist_b1.id,
            status=ShowStatus.PROPOSTA,
            client_type=ClientType.PRIVATE,
            negotiation_type=NegotiationType.COLOCADO_CIDADE,
            date_show=date.today() + timedelta(days=60),
            location_city="Rio de Janeiro",
            location_uf="RJ",
            base_price=Decimal("50000.00"),
            real_cache=Decimal("50000.00"),
            production_kickback=Decimal("0"),
            tax_percentage=Decimal("6.00"),
        )
        session.add(show_b)

        # =====================================================================
        # COMMIT FINAL
        # =====================================================================
        session.commit()

        print("\n" + "=" * 60)
        print("✅ SEEDING CONCLUÍDO COM SUCESSO!")
        print("=" * 60)
        print("\n📋 Resumo:")
        print(f"   • 2 Tenants criados")
        print(f"   • 6 Roles criados")
        print(f"   • 6 Usuários criados")
        print(f"   • 3 Artistas criados")
        print(f"   • 2 Contratantes criados")
        print(f"   • 2 Locais criados")
        print(f"   • 9 Registros de custos históricos")
        print(f"   • 3 Shows criados (1 completo, 1 sondagem, 1 tenant B)")
        print(f"   • 8 Transações financeiras")
        print(f"   • 3 Comissões (GROSS + NET)")
        print(f"   • 6 Itens de timeline (Day Sheet)")
        print(f"   • 3 Check-ins de presença")

        print(f"\n🔑 IDs para teste no Swagger (X-Dev-User-Id):")
        print(f"   Admin A:    {users_data['admin_user_a'].id}")
        print(f"   Produtor A: {users_data['produtor_user_a'].id}")
        print(f"   Vendedor A: {users_data['vendedor_user_a'].id}")
        print(f"   Músico A:   {users_data['musico_user_a'].id}")
        print(f"   Admin B:    {users_data['admin_user_b'].id}")

        print(f"\n🎪 Show Completo (DRE calculável):")
        print(f"   Show ID: {show_id}")
        print(f"   Valor de Face: R$ 200.000,00")
        print(f"   Cachê Real: R$ 180.000,00")
        print(f"   Retorno: R$ 20.000,00")
        print(f"   Status: CONCLUIDO (todas 6 etapas)")

        print(f"\n🚀 Inicie a API:")
        print(f"   uvicorn app.main:app --reload")
        print(f"   Acesse: http://localhost:8000/docs")
        print()


if __name__ == "__main__":
    seed()
