"use client";

import { useMemo } from "react";
import { FinancialTransaction } from "@/types/finance";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Receipt,
    PieChart,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceTabProps {
    showId: string;
    basePrice: number;
    transactions: FinancialTransaction[];
    loading?: boolean;
}

export function FinanceTab({ showId, basePrice, transactions, loading }: FinanceTabProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const dre = useMemo(() => {
        // 1. Receita Bruta
        const receitaBruta = basePrice;

        // 2. Impostos (Simulação de 10% padrão se não houver transação de imposto)
        const impostosTrans = transactions.filter(t => t.category === 'TAX').reduce((acc, t) => acc + t.realized_amount, 0);
        const impostosEstimados = receitaBruta * 0.10;
        const impostos = impostosTrans > 0 ? impostosTrans : impostosEstimados;

        // 3. Custos de Logística & Produção
        const custosLogistica = transactions
            .filter(t => ['FLIGHT', 'HOTEL', 'VAN', 'CATERING', 'TECHNICAL'].includes(t.category))
            .reduce((acc, t) => acc + t.realized_amount, 0);

        // 4. Custos Extras (Lançados na Estrada)
        const custosExtras = transactions
            .filter(t => t.category === 'OTHER')
            .reduce((acc, t) => acc + t.realized_amount, 0);

        // 5. Comissões (Ex: 10% sobre o Bruto)
        const comissoes = receitaBruta * 0.10;

        // Totais
        const totalDespesas = impostos + custosLogistica + custosExtras + comissoes;
        const lucroLiquido = receitaBruta - totalDespesas;
        const margemPercent = (lucroLiquido / receitaBruta) * 100;

        return {
            receitaBruta,
            impostos,
            custosLogistica,
            custosExtras,
            comissoes,
            totalDespesas,
            lucroLiquido,
            margemPercent
        };
    }, [basePrice, transactions]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-4">
                <div className="h-32 bg-slate-100 rounded-3xl" />
                <div className="h-64 bg-slate-100 rounded-3xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Hero Financeiro - Indicadores de Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] glass-card p-8 shadow-xl group hover:border-indigo-500/30 transition-all">

                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">

                            <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <Badge variant="outline" className="rounded-full border-emerald-100 text-emerald-600 text-[10px] font-black uppercase">Receita</Badge>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receita Bruto do Show</p>
                    <p className="text-3xl font-black text-slate-100 italic mt-1 tabular-nums">

                        {formatCurrency(dre.receitaBruta)}
                    </p>
                </Card>

                <Card className="rounded-[2.5rem] glass-card p-8 shadow-xl group hover:border-rose-500/30 transition-all">

                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-rose-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">

                            <TrendingDown className="h-6 w-6 text-rose-600" />
                        </div>
                        <Badge variant="outline" className="rounded-full border-rose-100 text-rose-600 text-[10px] font-black uppercase">Consumo</Badge>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total de Despesas Consolidado</p>
                    <p className="text-3xl font-black text-rose-600 italic mt-1 tabular-nums">
                        {formatCurrency(dre.totalDespesas)}
                    </p>
                </Card>

                <Card className={cn(
                    "rounded-[2.5rem] border-0 p-8 shadow-xl relative overflow-hidden group transition-all",
                    dre.lucroLiquido >= 0 ? "bg-indigo-900" : "bg-rose-900"
                )}>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-white/10 p-3 rounded-2xl">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <Badge className="rounded-full bg-white/20 text-white border-0 text-[10px] font-black uppercase">Liquidez</Badge>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Lucro Líquido Final (DRE)</p>
                        <p className="text-3xl font-black text-white italic mt-1 tabular-nums">
                            {formatCurrency(dre.lucroLiquido)}
                        </p>
                        <div className="flex items-center gap-1 mt-2">
                            {dre.lucroLiquido >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-400" /> : <ArrowDownRight className="h-4 w-4 text-rose-400" />}
                            <span className={cn("text-xs font-bold", dre.lucroLiquido >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                {dre.margemPercent.toFixed(1)}% de Margem
                            </span>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-10 -translate-y-10" />
                </Card>
            </div>

            {/* Tabela DRE Estilizada */}
            <Card className="rounded-[2.5rem] border-white/5 p-8 shadow-2xl glass-card overflow-hidden">

                <div className="flex items-center gap-2 mb-8">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-100 italic">Demonstrativo de Resultados (DRE)</h3>

                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-0">
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-4 px-6">Descrição da Transação</TableHead>
                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right py-4 px-6">Valor Contábil</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* Entradas */}
                            <TableRow className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <TableCell className="py-5 px-6">
                                    <span className="text-xs font-black text-emerald-600 uppercase tracking-tight">+ Receita do Contrato (Base)</span>
                                </TableCell>
                                <TableCell className="text-right py-5 px-6 font-bold tabular-nums text-slate-900">
                                    {formatCurrency(dre.receitaBruta)}
                                </TableCell>
                            </TableRow>

                            {/* Saídas */}
                            <TableRow className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <TableCell className="py-5 px-6">
                                    <span className="text-xs font-bold text-rose-500 uppercase tracking-tight">- Impostos (Simples/ISS)</span>
                                </TableCell>
                                <TableCell className="text-right py-5 px-6 font-medium tabular-nums text-rose-600">
                                    ({formatCurrency(dre.impostos)})
                                </TableCell>
                            </TableRow>

                            <TableRow className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <TableCell className="py-5 px-6">
                                    <span className="text-xs font-bold text-rose-500 uppercase tracking-tight">- Custos de Produção & Logística</span>
                                </TableCell>
                                <TableCell className="text-right py-5 px-6 font-medium tabular-nums text-rose-600">
                                    ({formatCurrency(dre.custosLogistica)})
                                </TableCell>
                            </TableRow>

                            <TableRow className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <TableCell className="py-5 px-6">
                                    <span className="text-xs font-bold text-rose-500 uppercase tracking-tight">- Despesas Extras (Na Estrada)</span>
                                </TableCell>
                                <TableCell className="text-right py-5 px-6 font-medium tabular-nums text-rose-600">
                                    ({formatCurrency(dre.custosExtras)})
                                </TableCell>
                            </TableRow>

                            <TableRow className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                <TableCell className="py-5 px-6">
                                    <span className="text-xs font-bold text-rose-500 uppercase tracking-tight">- Comissões de Venda</span>
                                </TableCell>
                                <TableCell className="text-right py-5 px-6 font-medium tabular-nums text-rose-600">
                                    ({formatCurrency(dre.comissoes)})
                                </TableCell>
                            </TableRow>

                            {/* Rodapé DRE */}
                            <TableRow className={cn(
                                "border-0 transition-colors",
                                dre.lucroLiquido >= 0 ? "bg-emerald-50/50" : "bg-rose-50/50"
                            )}>
                                <TableCell className="py-6 px-6">
                                    <p className="text-sm font-black uppercase italic tracking-widest text-slate-100">Resultado Final Líquido</p>

                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Sincronizado com fechamento de caixa</p>
                                </TableCell>
                                <TableCell className={cn(
                                    "text-right py-6 px-6 text-xl font-black italic tabular-nums",
                                    dre.lucroLiquido >= 0 ? "text-emerald-700" : "text-rose-700"
                                )}>
                                    {formatCurrency(dre.lucroLiquido)}
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {/* Split de Comissões */}
            <Card className="rounded-[2.5rem] border-slate-100 p-8 shadow-sm bg-slate-50/50">
                <div className="flex items-center gap-2 mb-6">
                    <AlertTriangle className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-100 italic">Distribuição de Comissões</h3>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-morphism p-6 rounded-3xl border border-white/10 space-y-2">

                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão sobre Bruto (Geral)</p>
                        <div className="flex justify-between items-end">
                            <p className="text-xl font-black text-slate-900 italic">{formatCurrency(dre.comissoes)}</p>
                            <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[9px] font-black uppercase">10% Base Bruta</Badge>
                        </div>
                    </div>
                    <div className="glass-morphism p-6 rounded-3xl border border-white/5 space-y-2 opacity-40 grayscale translate-y-1">

                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comissão sobre Líquido</p>
                        <div className="flex justify-between items-end">
                            <p className="text-xl font-black text-slate-900 italic">{formatCurrency(0)}</p>
                            <Badge className="bg-slate-100 text-slate-500 border-0 text-[9px] font-black uppercase">Não Configurada</Badge>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
