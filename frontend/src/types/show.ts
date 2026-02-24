export type ShowStatus =
    | 'SONDAGEM'
    | 'PROPOSTA'
    | 'CONTRATO_PENDENTE'
    | 'ASSINADO'
    | 'PRE_PRODUCAO'
    | 'CONCLUIDO';

export type ClientType = 'PRIVATE' | 'PUBLIC';

export interface Show {
    id: string;
    tenant_id: string;
    artist_id: string;
    status: ShowStatus;
    client_type: ClientType;
    negotiation_type: string;
    date_show: string; // Data do show (ISO format)
    location_city: string;
    location_uf: string;
    base_price: number;
    total_price: number;
    description?: string;
    contract_url?: string;
    daysheet_url?: string;
    created_at: string;
    updated_at: string;
}
