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
    ArrowDownRight,
    CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinanceTabProps {
    showId: string;
    basePrice: number;
    transactions: FinancialTransaction[];
    isConsolidated?: boolean;
    loading?: boolean;
}

export function FinanceTab({ showId, basePrice, transactions, isConsolidated, loading }: FinanceTabProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    const dre = useMemo(() => {
        // ...
        const receitaBruta = basePrice;

        // Mercado Público
        const valorEmpenhado = transactions.filter(t => t.public_payment_status === 'EMPENHADO' && t.type === 'REVENUE').reduce((acc, t) => acc + t.realized_amount, 0);
        const valorLiquidado = transactions.filter(t => t.public_payment_status === 'LIQUIDADO' && t.type === 'REVENUE').reduce((acc, t) => acc + t.realized_amount, 0);

        // ...
        const impostosTrans = transactions.filter(t => t.category === 'TAX').reduce((acc, t) => acc + t.realized_amount, 0);
        const impostosEstimados = receitaBruta * 0.10;
        const impostos = impostosTrans > 0 ? impostosTrans : impostosEstimados;

        const custosLogistica = transactions
            .filter(t => ['FLIGHT', 'HOTEL', 'VAN', 'CATERING', 'TECHNICAL'].includes(t.category || ''))
            .reduce((acc, t) => acc + t.realized_amount, 0);

        const custosExtras = transactions
            .filter(t => t.category === 'OTHER')
            .reduce((acc, t) => acc + t.realized_amount, 0);

        const comissoes = receitaBruta * 0.10;

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
            margemPercent,
            valorEmpenhado,
            valorLiquidado,
            isConsolidated: !!isConsolidated
        };
    }, [basePrice, transactions, isConsolidated]);

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

            {/* Trava Regra 03 do DRE (Fase 38) */}
            <div className={cn(
                "p-6 rounded-[2rem] border-2 shadow-sm flex items-center justify-between transition-all",
                dre.isConsolidated
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
            )}>
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-4 rounded-full",
                        dre.isConsolidated ? "bg-emerald-500/20" : "bg-amber-500/20"
                    )}>
                        <AlertTriangle className={cn("h-6 w-6", dre.isConsolidated ? "text-emerald-600" : "text-amber-600")} />
                    </div>
                    <div>
                        <h4 className={cn(
                            "text-sm font-black uppercase tracking-widest italic",
                            dre.isConsolidated ? "text-emerald-700" : "text-amber-700"
                        )}>
                            {dre.isConsolidated ? "DRE Consolidado (Trancado)" : "DRE (Status: PRÉVIA)"}
                        </h4>
                        <p className={cn("text-xs mt-1 max-w-lg", dre.isConsolidated ? "text-emerald-600/80" : "text-amber-600/80")}>
                            {dre.isConsolidated
                                ? "Este show já teve seu status 'Concluído' ou teve prestação de contas de estrada efetuada. Os números aqui dispostos são faturamento líquido absoluto da agência e não podem ser maquiados."
                                : "Ainda pendente de conclusão oficial ou fechamento de gastos de estrada. Os valores nesta página refletem a estimativa / prévia de lucros momentânea da agência baseada na precificação."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Timeline do Ciclo Público (Se houver empenho) */}
            {(dre.valorEmpenhado > 0 || dre.valorLiquidado > 0) && (
                <Card className="rounded-[2.5rem] border-amber-500/20 bg-amber-50/50 p-8 shadow-sm mb-8">
                    <div className="flex items-center gap-2 mb-6">
                        <Receipt className="h-5 w-5 text-amber-600" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 italic">Ciclo de Pagamento Público</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={cn("p-6 rounded-3xl border-2 transition-all", dre.valorEmpenhado > 0 ? "border-amber-400 bg-white" : "border-slate-200 opacity-50")}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">1. Empenhado</p>
                            <p className="text-2xl font-black text-amber-600 mt-2">{formatCurrency(dre.valorEmpenhado)}</p>
                            <p className="text-xs text-slate-400 mt-1">Valor com Nota de Empenho</p>
                        </div>
                        <div className={cn("p-6 rounded-3xl border-2 transition-all", dre.valorLiquidado > 0 ? "border-blue-400 bg-white" : "border-slate-200 opacity-50")}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">2. Liquidado</p>
                            <p className="text-2xl font-black text-blue-600 mt-2">{formatCurrency(dre.valorLiquidado)}</p>
                            <p className="text-xs text-slate-400 mt-1">Aguardando Ordem Bancária</p>
                        </div>
                        <div className={cn("p-6 rounded-3xl border-2 transition-all", transactions.some(t => t.public_payment_status === 'PAGO') ? "border-emerald-400 bg-white" : "border-slate-200 opacity-50")}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">3. Pago (Atesto)</p>
                            <p className="text-2xl font-black text-emerald-600 mt-2">Finalizado</p>
                            <p className="text-xs text-slate-400 mt-1">Recebimento conciliado</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Hero Financeiro - Indicadores de Impacto */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] glass-card p-8 shadow-xl group hover:border-indigo-500/30 transition-all">

                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl group-hover:scale-110 transition-transform">

                            <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <Badge variant="outline" className="rounded-full border-emerald-100 text-emerald-600 text-[10px] font-black uppercase">Receita</Badge>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receita Bruta do Show</p>
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

            {/* Checklist Ativo de Cobrança */}
            <Card className="rounded-[2.5rem] border-white/5 p-8 shadow-2xl glass-card">
                <div className="flex items-center gap-2 mb-6">
                    <CheckCircle className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-100 italic">Checklist de Cobrança & Contrato</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        {
                            label: "Contrato Assinado",
                            ok: transactions.some(t => t.category === 'REVENUE' && t.description.toLowerCase().includes('sinal')) || dre.receitaBruta > 0,
                            desc: "Status contratual ativo"
                        },
                        {
                            label: "Sinal Pago",
                            ok: transactions.some(t => t.category === 'REVENUE'),
                            desc: "Entrada financeira confirmada"
                        },
                        {
                            label: "Budget Logístico",
                            ok: dre.totalDespesas < (dre.receitaBruta * 0.25),
                            desc: "Margem de segurança mantida"
                        },
                        {
                            label: "DRE Consolidado",
                            ok: dre.lucroLiquido > 0,
                            desc: "Operação com saldo positivo"
                        }
                    ].map((item, idx) => (
                        <div key={idx} className={cn(
                            "p-4 rounded-3xl border transition-all",
                            item.ok ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-500/5 border-white/5 opacity-60"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                {item.ok ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-slate-500" />}
                                <span className={cn("text-[10px] font-black uppercase tracking-tight", item.ok ? "text-emerald-500" : "text-slate-400")}>{item.label}</span>
                            </div>
                            <p className="text-[9px] font-medium text-slate-500">{item.desc}</p>
                        </div>
                    ))}
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
