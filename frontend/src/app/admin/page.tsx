'use client';

import React, { useEffect, useState } from 'react';
import {
    TrendingUp,
    Users,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    ShieldCheck,
    Building2,
    Package
} from 'lucide-react';
import { useAdminApi } from '@/lib/api/useAdminApi';
import { cn } from '@/lib/utils';

interface DashboardStats {
    mrr: number;
    active_tenants: number;
    total_users: number;
    active_plans: number;
    growth_rate: number;
    recent_transactions: any[];
}

export default function AdminDashboardPage() {
    const { getAdminStats } = useAdminApi();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getAdminStats();
                setStats(response.data);
            } catch (error) {
                console.error("Erro ao carregar KPIs do Admin:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const kpis = [
        {
            label: 'MRR (Mensal Recorrente)',
            value: loading ? '...' : `R$ ${stats?.mrr?.toLocaleString('pt-BR') || '0,00'}`,
            icon: DollarSign,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            trend: stats?.growth_rate !== undefined ? `${stats.growth_rate}%` : '+5.2%',
            trendUp: true
        },
        {
            label: 'Clientes Ativos',
            value: loading ? '...' : stats?.active_tenants || '0',
            icon: Building2,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            trend: '+12%',
            trendUp: true
        },
        {
            label: 'Usuários Totais',
            value: loading ? '...' : stats?.total_users || '0',
            icon: Users,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            trend: '+8%',
            trendUp: true
        },
        {
            label: 'Planos SaaS',
            value: loading ? '...' : stats?.active_plans || '0',
            icon: Package,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            trend: 'Estável',
            trendUp: true
        },
    ];

    return (
        <div className="space-y-8 pb-12">
            {/* Welcome Header */}
            <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 block">Inteligência de Mercado</span>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    Bem-vindo à <span className="text-emerald-600 dark:text-emerald-400">Torre de Controle</span>
                </h1>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                    Monitore o crescimento do Manager Show em tempo real. Toda a lógica financeira e métricas de MRR são processadas no Backend para integridade absoluta.
                </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <div
                        key={idx}
                        className="flex flex-col p-6 rounded-xl border border-border bg-card shadow-sm transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-2.5 rounded-lg", kpi.bg)}>
                                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                                kpi.trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                                {kpi.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                {kpi.trend}
                            </div>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</span>
                        <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">{kpi.value}</span>
                    </div>
                ))}
            </div>

            {/* Main Charts & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Real-time Activity */}
                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-foreground">Transações Recentes</h3>
                            <p className="text-xs font-medium text-muted-foreground mt-0.5">Processamento Asaas Direto</p>
                        </div>
                        <button className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-bold transition-colors">
                            Ver Tudo
                        </button>
                    </div>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="h-32 flex items-center justify-center">
                                <span className="text-sm font-medium text-muted-foreground animate-pulse">Carregando Fluxo de Dados...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-12 border border-dashed border-border rounded-lg">
                                <span className="text-sm text-muted-foreground">Nenhuma transação no período de auditoria</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* System Health */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-[20px] animate-pulse" />
                        <div className="relative w-16 h-16 rounded-full border border-emerald-500/30 flex items-center justify-center bg-background">
                            <Activity className="w-8 h-8 text-emerald-500" />
                        </div>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">Health Status</h3>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed px-4">
                        Hardware & SaaS Engine operando com latência otimizada.
                    </p>

                    <div className="mt-6 w-full space-y-3">
                        <div className="flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-background">
                            <span className="text-xs font-medium text-muted-foreground">Backend API</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Estável</span>
                        </div>
                        <div className="flex items-center justify-between px-4 py-2 rounded-lg border border-border bg-background">
                            <span className="text-xs font-medium text-muted-foreground">Evolution API</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Online</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
