"use client";

import { cn } from "@/lib/utils";
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface ProfitLightProps {
    loading?: boolean;
    score?: number; // 0 a 100 ou baseado em margem
    message?: string;
    className?: string;
}

/**
 * ProfitLight - O famoso "Semáforo de Lucro" do Manager Show.
 * Exibe visualmente se uma negociação é viável com base nos dados históricos.
 */
export function ProfitLight({ loading, score, message, className }: ProfitLightProps) {
    if (loading) {
        return (
            <div className={cn("flex items-center gap-2 rounded-xl bg-slate-50 p-4 border border-slate-100 animate-pulse", className)}>
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter italic">Calculando Viabilidade Real...</span>
            </div>
        );
    }

    if (score === undefined) return null;

    const isGreen = score >= 30; // Exemplo: 30% de margem líquida

    return (
        <div className={cn(
            "flex flex-col gap-2 rounded-2xl p-4 border transition-all duration-500 shadow-sm",
            isGreen
                ? "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                : "bg-rose-50/50 border-rose-100 text-rose-700",
            className
        )}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-3 w-3 rounded-full animate-pulse",
                        isGreen ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                    )} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
                        Semáforo de Lucro
                    </span>
                </div>
                {isGreen ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>

            <div className="mt-1">
                <h5 className="text-sm font-black leading-tight">
                    {isGreen ? "NEGOCIAÇÃO VIÁVEL" : "ALERTA DE MARGEM BAIXA"}
                </h5>
                <p className="text-[11px] font-medium opacity-80 mt-0.5">
                    {message || (isGreen
                        ? "O preço base cobre as médias históricas de custos para esta região."
                        : "Atenção: Os custos operacionais previstos superam a margem de segurança.")}
                </p>
            </div>

            <div className="mt-2 flex items-center gap-1.5 overflow-hidden rounded-full bg-slate-200/30 h-1.5 font-bold">
                <div
                    className={cn("h-full transition-all duration-1000", isGreen ? "bg-emerald-500" : "bg-rose-500")}
                    style={{ width: `${Math.min(Math.max(score, 5), 100)}%` }}
                />
            </div>
            <div className="flex justify-between items-center mt-1">
                <span className="text-[9px] font-black opacity-50 uppercase tracking-tighter italic">Margem Estimada</span>
                <span className="text-[10px] font-black">{score.toFixed(0)}%</span>
            </div>
        </div>
    );
}
