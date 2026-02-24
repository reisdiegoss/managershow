export type CommercialLeadStatus = 'PROSPECÇÃO' | 'CONTATO' | 'NEGOCIAÇÃO' | 'GANHO' | 'PERDIDO';

export interface Seller {
    id: string;
    tenant_id: string;
    name: string;
    email?: string;
    phone?: string;
    user_id?: string;
    created_at: string;
}

export interface CommercialLead {
    id: string;
    tenant_id: string;
    contractor_name: string;
    contractor_id?: string;
    city: string;
    target_date?: string;
    estimated_budget?: number;
    status: CommercialLeadStatus;
    notes?: string;
    seller_id?: string;
    seller?: Seller;
    created_at: string;
    updated_at: string;
}

export interface ContractorNote {
    id: string;
    tenant_id: string;
    contractor_id: string;
    content: string;
    author_id?: string;
    created_at: string;
}
