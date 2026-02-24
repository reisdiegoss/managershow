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
    category: TransactionCategory;
    description: string;
    expected_amount: number;
    realized_amount: number;
    transaction_date: string;
    created_at?: string;
}
