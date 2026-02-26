export type ShowStatus =
    | 'SONDAGEM'
export type ShowStatus = 'LEAD' | 'NEGOTIATION' | 'CONTRACTED' | 'DONE' | 'CANCELED';

export type ClientType = 'PRIVATE' | 'PUBLIC';

export interface Show {
    id: string;
    tenant_id: string;
    artist_id: string;
    title: string;
    status: ShowStatus;
    client_type?: string;
    date_show: string; // Data do show (ISO format)
    location_city: string;
    location_uf: string;
    base_price: number;
    production_kickback: number;
    logistics_budget_limit: number;
    real_cache: number;
    notes?: string;
    contract_url?: string;
    is_date_locked: boolean;
    execution_media?: any[];
    created_at: string;
    updated_at: string;
}

export interface TimelineEvent {
    id: string;
    time: string; // ex: "14:30"
    title: string; // ex: "Saída do Hotel"
    description?: string;
    icon: 'flight' | 'hotel' | 'van' | 'music' | 'check'; // Mapear para Lucide Icons
    is_highlight?: boolean; // Para destacar o horário do SHOW
}

export type DiariaType = 'PADRAO' | 'MAIS_MEIA' | 'MAIS_UMA' | 'SEM_DIARIA' | 'OUTRO';
export type CacheType = 'PENDENTE' | 'PADRAO' | 'MEIO' | 'DOBRADO' | 'SEM_CACHE' | 'FALTOU';

export interface TeamMember {
    id: string;
    name: string;
    role: string; // Ex: 'Músico', 'Técnico', 'Roadie'
    isPresent: boolean; // Estado do check-in (LEGADO - será substituído por cache_type)
    diaria_type: DiariaType;
    diaria_justification?: string;
    cache_type: CacheType;
    is_eventual: boolean; // Flag para freelancers adicionados na hora
}
