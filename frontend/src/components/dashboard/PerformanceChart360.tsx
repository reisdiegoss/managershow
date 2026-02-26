"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from "recharts";
import { Card } from "@/components/ui/card";
import { Wallet, PieChart, Activity, AlertTriangle } from "lucide-react";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface PerformanceByArtistItem {
    artist_id: string;
    artist_name: string;
    total_shows: number;
    gross_revenue: number;
    total_costs: number;
    net_profit: number;
    profit_margin: number;
}

interface PerformanceDashboardResponse {
    items: PerformanceByArtistItem[];
    global_gross: number;
    global_costs: number;
    global_net: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
};

export function PerformanceChart360() {
    const { api } = useApi();
    const { toast } = useToast();
    const [data, setData] = useState<PerformanceDashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await api.get<PerformanceDashboardResponse>("/client/analytics/performance/artists");
                setData(response.data);
            } catch (error) {
                toast({
                    title: "Erro Analítico",
                    description: "Não foi possível agregar os dados pelo banco. Verifique sua conexão.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [api, toast]);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse p-4">
                <div className="h-48 bg-slate-100 rounded-[2rem]" />
                <div className="h-96 bg-slate-100 rounded-[2rem]" />
            </div>
        );
    }

    if (!data || data.items.length === 0) {
        return (
            <Card className="rounded-[2.5rem] p-12 flex flex-col items-center justify-center border-dashed border-2 shadow-sm text-slate-400">
                <Activity className="h-10 w-10 mb-4 opacity-50" />
                <p className="font-bold">Nenhum dado financeiro processado ainda.</p>
                <p className="text-sm">Os gráficos 360 aparecerão aqui quando você lançar shows na agenda.</p>
            </Card>
        );
    }

    const { global_gross, global_costs, global_net, items } = data;
    const global_margin = global_gross > 0 ? (global_net / global_gross) * 100 : 0;

    return (
        <div className="space-y-8">

            {/* Header / KPIs Globais da Agência */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6 rounded-3xl bg-slate-900 border-0 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Margem Global</p>
                        <p className="text-3xl font-black text-white italic">{global_margin.toFixed(1)}%</p>
                    </div>
                    <p className="text-xs text-slate-400 font-bold mt-4 border-t border-slate-800 pt-4">Rentabilidade Média</p>
                </Card>

                <Card className="p-6 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faturamento S/ Descontos</p>
                    <p className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(global_gross)}</p>
                </Card>

                <Card className="p-6 rounded-3xl border shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custos Executados</p>
                    <p className="text-2xl font-black text-rose-500 mt-2">{formatCurrency(global_costs)}</p>
                </Card>

                <Card className="p-6 rounded-3xl border shadow-sm bg-emerald-500/10 border-emerald-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Lucro Líquido</p>
                    <p className="text-2xl font-black text-emerald-600 mt-2">{formatCurrency(global_net)}</p>
                </Card>
            </div>

            {/* Performance por Artista - Gráfico Principal */}
            <Card className="p-8 rounded-[2.5rem] shadow-xl glass-card">
                <div className="flex items-center gap-2 mb-8">
                    <PieChart className="h-6 w-6 text-indigo-600" />
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 italic leading-none">Desempenho por Artista</h3>
                        <p className="text-xs text-slate-500 mt-1 font-bold">Faturamento Acumulado vs Lucro Real</p>
                    </div>
                </div>

                <div className="w-full h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={items}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            barGap={8}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="artist_name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                dy={10}
                            />
                            <YAxis
                                yAxisId="left"
                                orientation="left"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 12 }}
                                tickFormatter={(value) => `R$ ${value / 1000}k`}
                            />

                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)', padding: '20px' }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'Gross Revenue') return [formatCurrency(value), 'Faturamento Base'];
                                    if (name === 'Net Profit') return [formatCurrency(value), 'Lucro Restante'];
                                    return [value, name];
                                }}
                                labelStyle={{ fontWeight: 900, marginBottom: '10px', color: '#1e293b' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 700 }} />

                            <Bar yAxisId="left" dataKey="gross_revenue" name="Gross Revenue" fill="#94a3b8" radius={[6, 6, 0, 0]} maxBarSize={60} />
                            <Bar yAxisId="left" dataKey="net_profit" name="Net Profit" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Raio-X Detalhado (Tabela Analítica Oculta) */}
            <Card className="rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="bg-slate-50 px-8 py-5 border-b flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Breakdown Numérico</h4>
                    <Badge variant="outline" className="text-[9px]">O(1) Memory</Badge>
                </div>
                <div className="p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-white border-b">
                                <th className="text-left font-black text-slate-400 text-[10px] uppercase p-4 pl-8">Artista</th>
                                <th className="text-right font-black text-slate-400 text-[10px] uppercase p-4">Shows Rank</th>
                                <th className="text-right font-black text-slate-400 text-[10px] uppercase p-4 pr-8">Margem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((it, idx) => (
                                <tr key={idx} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                    <td className="p-4 pl-8 font-bold text-slate-700">{it.artist_name}</td>
                                    <td className="p-4 text-right tabular-nums text-slate-500">
                                        {it.total_shows} shows ({formatCurrency(it.gross_revenue)})
                                    </td>
                                    <td className="p-4 pr-8 text-right font-black">
                                        <span className={it.profit_margin >= 20 ? "text-emerald-500" : "text-amber-500"}>
                                            {it.profit_margin.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>
    );
}
