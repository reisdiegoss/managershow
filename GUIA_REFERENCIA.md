# Guia de Referência — Manager Show API

## Endpoints Disponíveis

### Retaguarda (`/api/v1/retaguarda`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/retaguarda/tenants/` | Criar tenant |
| GET | `/retaguarda/tenants/` | Listar tenants (paginado) |
| GET | `/retaguarda/tenants/{id}` | Buscar tenant |
| PATCH | `/retaguarda/tenants/{id}` | Atualizar tenant |
| POST | `/retaguarda/webhooks/asaas` | Webhook Asaas |
| GET | `/retaguarda/crm/leads` | Listar leads |
| POST | `/retaguarda/crm/leads` | Criar lead |
| GET/POST | `/retaguarda/tickets/...` | Help desk |

### Client (`/api/v1/client`)

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| POST | `/client/shows/` | Criar show (on-the-fly) | `can_create_shows` |
| GET | `/client/shows/` | Listar shows (paginado) | — |
| GET | `/client/shows/simulate` | Simulador de Viabilidade | `can_simulate_shows` |
| GET | `/client/shows/{id}` | Buscar show | — |
| PATCH | `/client/shows/{id}` | Atualizar show | `can_edit_shows` |
| POST | `/client/shows/{id}/contracts/` | Criar contrato | — |
| GET | `/client/shows/{id}/contracts/` | Listar contratos | — |
| POST | `/client/shows/{id}/contracts/validate` | **TRAVA MESTRA** | `can_approve_contracts` |
| POST | `/client/shows/{id}/logistics/` | Lançar custo | `can_add_expenses` |
| GET | `/client/shows/{id}/logistics/` | Listar custos | — |
| GET | `/client/shows/{id}/daysheet/` | Compilar Day Sheet | — |
| POST | `/client/shows/{id}/daysheet/items` | Adicionar item | — |
| POST | `/client/shows/{id}/daysheet/finalize` | Finalizar roteiro | — |
| POST | `/client/shows/{id}/road-closing/checkin` | Check-in batch | `can_checkin_crew` |
| POST | `/client/shows/{id}/road-closing/extras` | Despesa extra | `can_add_extra_expenses` |
| POST | `/client/shows/{id}/road-closing/close` | Fechar estrada | `can_close_road` |
| GET | `/client/shows/{id}/dre/` | DRE em tempo real | `can_view_dre` |

## Autenticação

- **Produção:** Header `Authorization: Bearer <JWT_CLERK>`
- **Desenvolvimento:** Header `X-Dev-User-Id: <UUID_DO_USUARIO>`

## Formato de Resposta de Erro

```json
{
    "error": "CODIGO_DO_ERRO",
    "message": "Mensagem em PT-BR",
    "details": []
}
```

## Enums

### ShowStatus

`SONDAGEM → PROPOSTA → CONTRATO_PENDENTE → ASSINADO → PRE_PRODUCAO → EM_ESTRADA → CONCLUIDO`

### NegotiationType

`CACHE_DESPESAS | COLOCADO_CIDADE | COLOCADO_TOTAL | PERSONALIZADO`

### ClientType

`PRIVATE | PUBLIC`

### TransactionType

`REVENUE | PRODUCTION_COST | LOGISTICS_COST | TAX | COMMISSION | KICKBACK | EXTRA_EXPENSE`

### CommissionBase

`GROSS (sobre bruto) | NET (sobre líquido)`
