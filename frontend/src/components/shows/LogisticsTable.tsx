"use client";

import { FinancialTransaction, TransactionCategory } from "@/types/finance";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt, Plane, Hotel, Truck, Utensils, Box, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogisticsTableProps {
    transactions: FinancialTransaction[];
    loading?: boolean;
}

const categoryIcons: Record<TransactionCategory, any> = {
    FLIGHT: Plane,
    HOTEL: Hotel,
    VAN: Truck,
    BACKLINE: Box,
    CREW_PAYMENT: Utensils, // Adaptado
    FEE: Receipt,
    TAX: Receipt,
    OTHER: MoreHorizontal,
};

const categoryLabels: Record<TransactionCategory, string> = {
    FLIGHT: "Voo / Aéreo",
    HOTEL: "Hospedagem",
    VAN: "Transfer / Van",
    BACKLINE: "Backline",
    CREW_PAYMENT: "Equipe",
    FEE: "Taxa / Fee",
    TAX: "Imposto",
    OTHER: "Outros",
};

const categoryColors: Record<TransactionCategory, string> = {
    FLIGHT: "bg-blue-50 text-blue-700 border-blue-100",
    HOTEL: "bg-orange-50 text-orange-700 border-orange-100",
    VAN: "bg-indigo-50 text-indigo-700 border-indigo-100",
    BACKLINE: "bg-slate-50 text-slate-700 border-slate-100",
    CREW_PAYMENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
    FEE: "bg-amber-50 text-amber-700 border-amber-100",
    TAX: "bg-rose-50 text-rose-700 border-rose-100",
    OTHER: "bg-slate-50 text-slate-700 border-slate-100",
};

export function LogisticsTable({ transactions, loading }: LogisticsTableProps) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 w-full animate-pulse bg-slate-50 rounded-xl" />
                ))}
            </div>
        );
    }

    if (transactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50">
                <div className="bg-white p-4 rounded-full shadow-sm text-slate-400">
                    <Receipt className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Cofre Intacto</p>
                    <p className="text-xs font-medium text-slate-500 italic">Nenhuma despesa de logística registrada para este evento.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-[2rem] border border-slate-100 bg-white overflow-hidden shadow-sm">
            <Table>
                <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Data</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Valor (R$)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((t) => {
                        const Icon = categoryIcons[t.category] || MoreHorizontal;
                        return (
                            <TableRow key={t.id} className="border-slate-50 hover:bg-slate-50/30 transition-all">
                                <TableCell className="text-[11px] font-bold text-slate-500 italic">
                                    {format(new Date(t.transaction_date), "dd/MM/yy", { locale: ptBR })}
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn("rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter border", categoryColors[t.category])}>
                                        <Icon className="mr-1 h-3 w-3" /> {categoryLabels[t.category]}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-xs font-bold text-slate-700 italic">
                                    {t.description}
                                </TableCell>
                                <TableCell className="text-right font-black tabular-nums text-slate-900">
                                    {t.realized_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
