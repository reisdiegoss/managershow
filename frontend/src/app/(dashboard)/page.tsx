"use client";

import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts";
import {
    DollarSign,
    TrendingUp,
    Calendar,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Dados Mockados para o Dashboard
const monthlyData = [
    { name: "Set", receita: 45000, despesa: 28000 },
    { name: "Out", receita: 52000, despesa: 32000 },
    { name: "Nov", receita: 48000, despesa: 30000 },
    { name: "Dez", receita: 85000, despesa: 45000 },
    { name: "Jan", receita: 38000, despesa: 25000 },
    { name: "Fev", receita: 62000, despesa: 38000 },
];

const artistShareData = [
    { name: "Alok Petrillo", value: 45 },
    { name: "Zezé Di Camargo", value: 30 },
    { name: "Vintage Culture", value: 15 },
    { name: "Outros", value: 10 },
];

const COLORS = ["#4f46e5", "#ec4899", "#8b5cf6", "#94a3b8"];

export default function DashboardPage() {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header do Dashboard */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    Visão de <span className="text-primary">Águia</span>
                </h1>
                <p className="text-sm font-medium text-muted-foreground mt-1">
                    Performance Global da Produtora — Últimos 6 meses
                </p>
            </div>

            {/* Grid de KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    title="Faturamento Mensal"
                    value={formatCurrency(62000)}
                    subValue="+12% vs mês anterior"
                    icon={DollarSign}
                    trend="up"
                />
                <KPICard
                    title="Lucro Líquido"
                    value={formatCurrency(24000)}
                    subValue="38.7% de Margem"
                    icon={TrendingUp}
                    trend="up"
                    highlight
                />
                <KPICard
                    title="Shows Ativos"
                    value="14"
                    subValue="8 Cidades diferentes"
                    icon={Calendar}
                    trend="neutral"
                />
                <KPICard
                    title="Alertas de Risco"
                    value="03"
                    subValue="Contratos Pendentes"
                    icon={AlertCircle}
                    trend="down"
                    alert
                />
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Receita vs Despesa */}
                <Card className="lg:col-span-2 rounded-xl border border-border p-6 shadow-sm bg-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-foreground">Receita vs Despesa</h3>
                        <Badge variant="outline" className="rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Consolidado Semestral</Badge>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                                <YAxis hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="receita" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                                <Bar dataKey="despesa" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Share por Artista */}
                <Card className="rounded-xl border border-border p-6 shadow-sm bg-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-foreground">Share por Artista</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={artistShareData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {artistShareData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function KPICard({ title, value, subValue, icon: Icon, trend, highlight, alert }: any) {
    return (
        <Card className={cn(
            "rounded-xl p-6 shadow-sm transition-all border border-border",
            highlight ? "bg-primary text-primary-foreground border-transparent shadow-md shadow-primary/20" : "bg-card",
            alert ? "bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900" : ""
        )}>
            <div className="flex items-center justify-between mb-4">
                <div className={cn(
                    "p-2.5 rounded-lg",
                    highlight ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
                    alert ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400" : ""
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                {trend !== 'neutral' && (
                    <div className={cn(
                        "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                        trend === 'up' ? (highlight ? "text-emerald-100" : "text-emerald-600 dark:text-emerald-400") : "text-rose-600 dark:text-rose-400"
                    )}>
                        {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {trend === 'up' ? "Alta" : "Risco"}
                    </div>
                )}
            </div>
            <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", highlight ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {title}
            </p>
            <p className={cn("text-3xl font-extrabold tracking-tight tabular-nums", highlight ? "text-primary-foreground" : "text-foreground")}>
                {value}
            </p>
            <p className={cn("text-xs font-medium mt-1.5", highlight ? "text-primary-foreground/90" : "text-muted-foreground")}>
                {subValue}
            </p>
        </Card>
    );
}

