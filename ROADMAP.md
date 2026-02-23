# Roadmap — Manager Show API

## Fase 1: Setup + Esqueleto ✅ (v0.1.0)

- [x] Projeto FastAPI com Pydantic Settings
- [x] SQLAlchemy 2.0 async com Multi-Tenant Mixin
- [x] 14 Models (Tenant, User, Role, Show, Artist, etc.)
- [x] RBAC com JSONB + `require_permissions()`
- [x] Auth Clerk JWT + modo dev
- [x] Routers Retaguarda (Tenants CRUD, Webhooks Asaas)
- [x] Routers Client (Shows, Contracts, Logistics, DaySheet, Road Closing, DRE)
- [x] Exception Handler global (PT-BR)
- [x] Alembic + Seed completo
- [x] Documentação (CHANGELOG, GUIA_REFERENCIA, GUIA_TECNICO, ROADMAP)

## Fase 2: Services e Repositories (Próxima)

- [ ] Implementar camada de Services (lógica de negócio extraída dos routers)
- [ ] Implementar camada de Repositories com filtro obrigatório multi-tenant
- [ ] Testes unitários dos Services
- [ ] Validação completa da Regra 01 (travar negotiation_type após contrato)
- [ ] Endpoint de clonagem de roles (`POST /roles/{id}/clone`)

## Fase 3: Simulador Avançado + DRE Consolidável

- [ ] Simulador com mais categorias de custo (VAN, MEALS, etc.)
- [ ] DRE consolidável apenas após road_closed (Regra 03)
- [ ] Dashboard de performance por artista/período
- [ ] Geração de PDF do Day Sheet (WeasyPrint)

## Fase 4: Integrações Externas

- [ ] Clerk real (JWKS em produção)
- [ ] Asaas webhook em produção
- [ ] Celery workers para notificações (Day Sheet pronto)
- [ ] Upload de arquivos (S3/MinIO) para recibos e contratos

## Fase 5: CRM + Help Desk

- [ ] CRM interno completo (funil de leads)
- [ ] Sistema de tickets (Help Desk)
- [ ] WhatsApp API para disparos

## Fase 6: Mobile API + Offline-Sync

- [ ] Endpoints otimizados para React Native
- [ ] Estratégia de sync offline-first
- [ ] Push Notifications (FCM)
