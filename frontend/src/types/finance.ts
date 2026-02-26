export type TransactionCategory =
    | 'FLIGHT'
    | 'HOTEL'
    | 'VAN'
    | 'BACKLINE'
    | 'CREW_PAYMENT'
    | 'FEE'
    | 'TAX'
    | 'OTHER';

export interface FinancialTransaction {
    id: string;
    show_id: string;
    tenant_id: string;
    description: string;
    budgeted_amount: number;
    realized_amount: number;
    receipt_url?: string;
    is_auto_generated: boolean;
    created_at: string;
    type?: string;
    category?: string;
    public_payment_status?: 'PENDING_EMPENHO' | 'EMPENHADO' | 'LIQUIDADO' | 'PAGO';
}
