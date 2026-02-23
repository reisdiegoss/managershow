# Guia Técnico — Manager Show API

## Stack Tecnológica

| Componente | Tecnologia | Versão |
|-----------|-----------|---------|
| Framework | FastAPI | 0.115+ |
| Linguagem | Python | 3.10+ |
| Banco de Dados | PostgreSQL | 15+ |
| ORM | SQLAlchemy (async) | 2.0+ |
| Driver Async | asyncpg | 0.30+ |
| Migrações | Alembic | 1.13+ |
| Validação | Pydantic V2 | 2.7+ |
| Cache/Filas | Redis + Celery | 5.0+ / 5.4+ |
| Auth | Clerk (JWT RS256) | — |
| Pagamento SaaS | Asaas (Webhooks) | — |

## Arquitetura

```
                    ┌─────────────────────┐
                    │    FastAPI (main)    │
                    │  CORS + Exceptions  │
                    └─────────┬───────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────┴──────────┐         ┌──────────┴─────────┐
    │    Retaguarda       │         │      Client         │
    │  /api/v1/retaguarda │         │  /api/v1/client     │
    │  (Super Admin)      │         │  (Agências)         │
    └────────┬────────────┘         └──────────┬──────────┘
             │                                 │
    ┌────────┴────────┐            ┌───────────┴──────────┐
    │ Routers (thin)  │            │ Routers (thin)       │
    └────────┬────────┘            └───────────┬──────────┘
             │                                 │
    ┌────────┴────────┐            ┌───────────┴──────────┐
    │ Services        │            │ Services             │
    │ (Regras Negócio)│            │ (Regras Negócio)     │
    └────────┬────────┘            └───────────┬──────────┘
             │                                 │
    ┌────────┴─────────────────────────────────┴─────────┐
    │              Repositories (DAOs)                    │
    │         Filtro obrigatório por tenant_id            │
    └────────────────────┬───────────────────────────────┘
                         │
    ┌────────────────────┴───────────────────────────────┐
    │          SQLAlchemy 2.0 Async (asyncpg)            │
    │              PostgreSQL + Redis                     │
    └────────────────────────────────────────────────────┘
```

## Regras Críticas

1. **Multi-Tenancy**: TODA query DEVE filtrar por `tenant_id`
2. **Dinheiro**: SEMPRE `Numeric(14,2)` — NUNCA `Float`
3. **Negócio nos Services**: PROIBIDO regras de negócio nos routers
4. **Exceções de Domínio**: NUNCA vazar erros internos (ex: `IntegrityError`)
5. **TRAVA MESTRA**: Etapa 3 bloqueada se `contract_validated == False`
6. **DRE em Tempo Real**: Calculado, nunca armazenado
7. **Retorno/Produção**: NUNCA contabilizar como lucro no DRE

## Permissões RBAC

Armazenadas como JSONB no campo `permissions` da tabela `roles`:

```json
{
    "is_admin": false,
    "can_view_financials": false,
    "can_view_dre": false,
    "can_manage_commissions": false,
    "can_approve_contracts": false,
    "can_generate_contracts": false,
    "can_create_shows": false,
    "can_edit_shows": false,
    "can_delete_shows": false,
    "can_simulate_shows": false,
    "can_add_expenses": false,
    "can_manage_daysheet": false,
    "can_close_road": false,
    "can_checkin_crew": false,
    "can_add_extra_expenses": false,
    "can_manage_users": false,
    "can_manage_roles": false,
    "can_manage_artists": false,
    "can_manage_contractors": false
}
```

## Como Rodar

```powershell
# 1. Criar virtualenv e instalar dependências
python -m venv .venv; .venv\Scripts\activate; pip install -e ".[dev]"

# 2. Criar banco no PostgreSQL
# (Certifique-se de que o PostgreSQL está rodando com o banco 'managershow')

# 3. Rodar migrações
python -m alembic upgrade head

# 4. Popular banco com dados de teste
python -m scripts.seed

# 5. Iniciar API
uvicorn app.main:app --reload --port 8000

# 6. Acessar Swagger
# http://localhost:8000/docs
```
