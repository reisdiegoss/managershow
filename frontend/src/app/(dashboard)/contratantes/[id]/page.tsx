'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, MapPin, DollarSign, Calendar, TrendingUp, History, ListFilter, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/lib/api';
import { ContractorNote } from '@/types/crm';
import { Show } from '@/types/show';
import { Contractor } from '@/types/base';
import { ContractorNoteTimeline } from '@/components/crm/ContractorNoteTimeline';
import { Loader2 } from 'lucide-react';

interface ContractorPageProps {
    params: { id: string };
}

export default function ContractorProfilePage({ params }: ContractorPageProps) {
    const { api } = useApi();
    const [contractor, setContractor] = useState<Contractor | null>(null);
    const [notes, setNotes] = useState<ContractorNote[]>([]);
    const [shows, setShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                // Busca dados do contratante (Poderíamos ter um endpoint específico de perfil, mas vamos usar o que temos)
                // Nota: Aqui idealmente teríamos GET /contractors/{id}
                const [cRes, nRes, sRes] = await Promise.all([
                    api.get(`/client/contractors`), // Simulação: Filtrar no client por enquanto se não houver ID endpoint
                    api.get(`/client/contractors/${params.id}/notes`),
                    api.get(`/client/contractors/${params.id}/shows`),
                ]);

                // Ajuste para encontrar o contratante específico na lista
                const found = cRes.data.find((c: any) => c.id === params.id);
                setContractor(found);
                setNotes(nRes.data);
                setShows(sRes.data);
            } catch (error) {
                console.error('Erro ao carregar perfil do contratante:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [api, params.id]);

    // Cálculos de LTV (Lifetime Value)
    const stats = {
        totalShows: shows.length,
        totalInvested: shows.reduce((acc, s) => acc + (s.base_price || 0), 0),
        avgPrice: shows.length > 0 ? shows.reduce((acc, s) => acc + (s.base_price || 0), 0) / shows.length : 0,
        lastShowDate: shows[0]?.date_show ? new Date(shows[0].date_show).toLocaleDateString('pt-BR') : 'N/A'
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!contractor) return <div>Contratante não encontrado.</div>;

    return (
        <div className="space-y-8">
            {/* Header / Hero */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Building2 size={240} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 py-1 px-4 rounded-full font-black uppercase italic tracking-widest text-[10px]">
                            Parceiro Verificado
                        </Badge>
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                            {contractor.name}
                        </h1>
                        <div className="flex flex-wrap gap-4 text-slate-400 text-sm font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-2 italic"><MapPin size={16} /> {contractor.city} - {contractor.state}</span>
                            <span className="flex items-center gap-2 italic"><Building2 size={16} /> {contractor.document}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/10">
                            <p className="text-[10px] font-black uppercase text-blue-400 mb-1">Total Negociado</p>
                            <p className="text-2xl font-black italic">R$ {stats.totalInvested.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-6 border border-white/10">
                            <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">Eventos Realizados</p>
                            <p className="text-2xl font-black italic">{stats.totalShows}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPIs Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Ticket Médio', value: `R$ ${stats.avgPrice.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-blue-600' },
                    { label: 'Último Show', value: stats.lastShowDate, icon: Calendar, color: 'text-indigo-600' },
                    { label: 'Selo Qualidade', value: 'TIER 1', icon: ListFilter, color: 'text-amber-500' },
                    { label: 'Vendedores', value: '3 Atendendo', icon: Users, color: 'text-slate-600' },
                ].map((kpi, idx) => (
                    <Card key={idx} className="p-6 rounded-[2rem] border-slate-100 shadow-sm flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-all">
                        <kpi.icon className={`h-8 w-8 ${kpi.color} mb-3`} />
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{kpi.label}</p>
                        <p className="text-lg font-black italic text-slate-900">{kpi.value}</p>
                    </Card>
                ))}
            </div>

            {/* Abas de Detalhes */}
            <Tabs defaultValue="historico" className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] mb-8 inline-flex">
                    <TabsTrigger value="historico" className="rounded-full px-8 py-3 font-black uppercase italic text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <History size={16} className="mr-2" /> Timeline Comercial
                    </TabsTrigger>
                    <TabsTrigger value="shows" className="rounded-full px-8 py-3 font-black uppercase italic text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <ListFilter size={16} className="mr-2" /> Shows Relacionados
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="historico">
                    <ContractorNoteTimeline contractorId={params.id} initialNotes={notes} />
                </TabsContent>

                <TabsContent value="shows">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shows.map((show) => (
                            <Card key={show.id} className="p-6 rounded-3xl border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-200 transition-all bg-white">
                                <div className="space-y-1">
                                    <h4 className="font-black italic uppercase text-slate-900">{show.artist_id}</h4>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {show.date_show ? new Date(show.date_show).toLocaleDateString() : 'N/A'}</span>
                                        <span className="flex items-center gap-1"><MapPin size={12} /> {show.location_city}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-blue-600 mb-0.5">Valor do Contrato</p>
                                    <p className="font-black italic text-slate-900">R$ {show.base_price?.toLocaleString('pt-BR')}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
