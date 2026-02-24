export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
export type SaaSPlan = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface SaaSTenant {
    id: string;
    name: string;
    document?: string;
    email?: string;
    status: TenantStatus;
    plan: SaaSPlan;
    max_users: number;
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
