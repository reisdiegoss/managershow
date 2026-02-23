# Changelog — Manager Show API

Todas as alterações notáveis neste projeto serão documentadas aqui.

---

## [0.1.0] — 2026-02-23

### Adicionado

- **Setup do Projeto FastAPI** com Pydantic Settings, SQLAlchemy 2.0 async e Redis
- **14 Models SQLAlchemy** com Multi-Tenant Mixin (TenantMixin):
  - `Tenant`, `User`, `Role` (RBAC com JSONB), `Artist`
  - `Show` (centro da arquitetura com máquina de estados e trava mestra)
  - `Contractor`, `Venue` (cadastro on-the-fly)
  - `FinancialTransaction` (ledger com TransactionType/Category)
  - `Commission` (GROSS vs NET), `Contract`, `LogisticsTimeline`
  - `CityBaseCost` (Simulador de Viabilidade), `ShowCheckin`
- **Motor de Permissões RBAC** com JSONB e decorator `require_permissions()`
- **Autenticação Clerk JWT** com JWKS + modo dev com header `X-Dev-User-Id`
- **6 Schemas Pydantic V2** com validação financeira (Decimal, real_cache <= base_price)
- **Routers Retaguarda** (`/api/v1/retaguarda`):
  - `tenants`: CRUD completo com paginação
  - `webhooks/asaas`: Renovação/suspensão de tenant por webhook
  - `crm`: Esqueleto do CRM interno
  - `tickets`: Esqueleto do Help Desk
- **Routers Client** (`/api/v1/client`):
  - `shows`: CRUD + cadastro on-the-fly + Simulador de Viabilidade
  - `contracts`: TRAVA MESTRA (contract_validated) com RBAC
  - `logistics`: Lançamento de custos com budget_overflow
  - `daysheet`: Timeline + finalização
  - `road-closing`: Check-in batch offline-sync + despesas extras
  - `dre`: DRE calculado em tempo real (fórmula completa da Bíblia)
- **Exception Handler Global** com respostas padronizadas em PT-BR
- **Alembic** configurado para migrações com autogenerate
- **Script de Seed** completo com 2 tenants, 6 usuários, 3 shows e DRE calculável
- **Documentação**: CHANGELOG, GUIA_REFERENCIA, GUIA_TECNICO, ROADMAP
