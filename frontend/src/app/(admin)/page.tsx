'use client';

import React from 'react';
import {
    TrendingUp,
    Users,
    LifeBuoy,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

const data = [
    { name: 'Set', assinaturas: 4, cancelamentos: 1 },
    { name: 'Out', assinaturas: 7, cancelamentos: 0 },
    { name: 'Nov', assinaturas: 5, cancelamentos: 2 },
    { name: 'Dez', assinaturas: 12, cancelamentos: 1 },
    { name: 'Jan', assinaturas: 18, cancelamentos: 3 },
    { name: 'Fev', assinaturas: 24, cancelamentos: 2 },
];

export default function AdminDashboardPage() {
    return (
        <div className="space-y-10">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: 'MRR Atual',
                        value: 'R$ 42.500',
                        sub: '+12.5% vs mês anterior',
                        icon: DollarSign,
                        color: 'text-emerald-500',
                        trend: 'up'
                    },
                    {
                        title: 'Taxa de Churn',
                        value: '2.4%',
                        sub: '-0.8% melhoria',
                        icon: TrendingUp,
                        color: 'text-rose-500',
                        trend: 'down'
                    },
                    {
                        title: 'Tenants Ativos',
                        value: '128',
                        sub: '92% taxa de retenção',
                        icon: Users,
                        color: 'text-blue-500',
                        trend: 'up'
                    },
                    {
                        title: 'Tickets Abertos',
                        value: '14',
                        sub: '3 urgentes agora',
                        icon: LifeBuoy,
                        color: 'text-amber-500',
                        trend: 'none'
                    },
                ].map((kpi, idx) => (
                    <Card key={idx} className="rounded-[2.5rem] border-slate-200/60 shadow-sm overflow-hidden group hover:border-emerald-200 transition-all">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-8">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                {kpi.title}
                            </CardTitle>
                            <div className={cn("p-2 rounded-xl bg-slate-50 group-hover:bg-emerald-50 transition-colors", kpi.color)}>
                                <kpi.icon size={18} />
                            </div>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="text-3xl font-black italic tracking-tighter text-slate-900 mb-1">{kpi.value}</div>
                            <div className="flex items-center gap-1.5 pt-1">
                                {kpi.trend === 'up' && <ArrowUpRight size={14} className="text-emerald-500" />}
                                {kpi.trend === 'down' && <ArrowDownRight size={14} className="text-emerald-500" />}
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight italic">
                                    {kpi.sub}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 rounded-[3rem] border-slate-200/60 shadow-sm p-8">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-lg font-black italic uppercase tracking-tight text-slate-900">Crescimento de Assinaturas</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronia Semestral de Novos Clientes</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-black uppercase text-slate-500">Novas</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full bg-slate-200" />
                                <span className="text-[9px] font-black uppercase text-slate-500">Cancelamentos</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                />
                                <Bar dataKey="assinaturas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={35} />
                                <Bar dataKey="cancelamentos" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={35} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="rounded-[3rem] border-slate-200/60 shadow-sm p-8 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Activity size={180} />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-black italic uppercase tracking-tight mb-2">Saúde do Sistema</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-10">Monitoramento em Tempo Real</p>

                        <div className="space-y-8">
                            {[
                                { label: 'Uptime API', value: '99.98%', color: 'bg-emerald-500' },
                                { label: 'Sync Redis', value: 'Ativo', color: 'bg-emerald-500' },
                                { label: 'Worker Latency', value: '45ms', color: 'bg-emerald-500' },
                                { label: 'DB Connections', value: '12%', color: 'bg-blue-500' },
                            ].map((stat, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">{stat.label}</span>
                                        <span className="text-xs font-black italic">{stat.value}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full w-[85%]", stat.color)} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full mt-10 py-4 rounded-2xl bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                            Ver Logs do Servidor
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Auxiliar para Shadcn
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
