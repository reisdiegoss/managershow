export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
export type SaaSPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface SaaSTenant {
    id: string;
    name: string;
    document?: string;
    cnpj?: string;
    address?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    contact_name?: string;
    contact_phone?: string;
    email?: string;
    phone?: string;
    status: TenantStatus;
    plan: SaaSPlan;
    account_type: 'ARTIST' | 'AGENCY';
    plan_id?: string;
    plan_type: string;
    max_users: number;
    max_storage_gb: number;
    whatsapp_limit: number;
    is_suspended: boolean;
    is_onboarded: boolean;
    subscription_expires_at?: string;
    created_at: string;
}

export type TicketStatus = 'ABERTO' | 'EM_ATENDIMENTO' | 'RESOLVIDO' | 'FECHADO';
export type TicketPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface SaaSTicket {
    id: string;
    tenant_id: string;
    tenant_name?: string;
    user_id?: string;
    user_name?: string;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    category?: string;
    created_at: string;
}

export interface TicketReply {
    id: string;
    ticket_id: string;
    author_name: string;
    content: string;
    is_internal: boolean;
    created_at: string;
}
