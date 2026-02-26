'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
    Clock,
    MapPin,
    Navigation,
    CloudRain,
    Calendar,
    AudioLines,
    ChevronRight,
    CheckCircle2,
    Loader2
} from 'lucide-react';
import { publicApi } from '@/lib/public-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActiveRouteMap } from '@/components/shows/ActiveRouteMap';
import { WeatherWidget } from '@/components/shows/WeatherWidget';

interface TimelineItem {
    id: string;
    time: string;
    description: string;
    type: string;
}

interface DaySheetData {
    show: {
        id: string;
        city: string;
        uf: string;
        date: string;
        artist: string;
    };
    timeline: TimelineItem[];
    weather: {
        temp: number | null;
        condition: string | null;
    };
}

export default function PublicDaySheetPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const showId = params.showId as string;
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DaySheetData | null>(null);
    const [readRegistered, setReadRegistered] = useState(false);

    useEffect(() => {
        if (showId) {
            loadDaySheet();
        }
    }, [showId]);

    const loadDaySheet = async () => {
        try {
            setLoading(true);
            const response = await publicApi.get<DaySheetData>(`/public/daysheet/${showId}`);
            setData(response.data);

            // Registrar leitura automaticamente se houver token
            if (token && !readRegistered) {
                await registerRead(token);
            }
        } catch (error) {
            console.error("Erro ao carregar roteiro:", error);
        } finally {
            setLoading(false);
        }
    };

    const registerRead = async (trackerToken: string) => {
        try {
            const response = await publicApi.get<{ status: string }>(`/public/crew/${trackerToken}/read`);
            if (response.data.status === 'success') {
                setReadRegistered(true);
            }
        } catch (error) {
            console.error("Rastreador falhou (Silencioso)", error);
        }
    };

    const openGps = (location: string) => {
        const encoded = encodeURIComponent(location);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
    };

    if (loading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#020617] text-white">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-sm font-black italic uppercase tracking-widest animate-pulse">
                    Sincronizando Roteiro...
                </p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-[#020617] p-8 text-center text-white">
                <Badge variant="destructive" className="mb-4">ERRO 404</Badge>
                <h1 className="text-2xl font-black uppercase italic italic">Roteiro não encontrado</h1>
                <p className="mt-2 text-slate-400 text-sm">Este link pode ter expirado ou o show foi cancelado.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 pb-12 font-sans selection:bg-emerald-500/30">
            {/* Header / Banner Artista */}
            <header className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-900 to-emerald-950 px-6 pt-12">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <AudioLines className="h-32 w-32" />
                </div>

                <div className="relative z-10 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-[10px] font-black italic uppercase">Day Sheet Oficial</Badge>
                        {readRegistered && (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Recebido
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white mt-2">
                        {data.show.artist}
                    </h1>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-[11px]">
                        <MapPin className="h-4 w-4" />
                        {data.show.city} • {data.show.uf}
                    </div>
                </div>
            </header>

            {/* Embed Map Integration */}
            <div className="px-4 mt-6">
                <ActiveRouteMap
                    address="Centro"
                    city={data.show.city}
                    uf={data.show.uf}
                    className="h-48"
                />
            </div>

            {/* Info Cards Rápidos */}
            <div className="grid grid-cols-2 gap-3 px-4 mt-6 relative z-20">
                <div className="rounded-2xl bg-slate-900/80 border border-white/5 p-4 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center gap-2 text-slate-500 mb-2">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Data</span>
                    </div>
                    <p className="text-lg font-black text-white italic">
                        {new Date(data.show.date).toLocaleDateString('pt-BR')}
                    </p>
                </div>

                <WeatherWidget
                    temp={data.weather.temp}
                    condition={data.weather.condition}
                />
            </div>

            {/* Timeline Principal */}
            <main className="mt-8 px-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Cronograma do Evento</h2>
                </div>

                <div className="relative space-y-4 before:absolute before:left-[19px] before:top-4 before:h-full before:w-px before:bg-gradient-to-b before:from-emerald-500 before:to-slate-900">
                    {data.timeline.length > 0 ? (
                        data.timeline.map((item, idx) => (
                            <div key={item.id} className="relative flex gap-4 animate-in slide-in-from-bottom-2 fade-in" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
                                    <Clock className="h-5 w-5 text-emerald-500" />
                                </div>

                                <Card className="flex-1 glass-card border-white/5 bg-slate-900/40 rounded-2xl overflow-hidden hover:bg-slate-900/60 transition-colors">
                                    <div className="bg-emerald-500/5 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                                        <span className="text-[11px] font-black text-white tracking-widest uppercase italic">{item.time.slice(0, 5)}</span>
                                        <Badge className="bg-slate-950 text-[9px] font-bold text-slate-400">{item.type}</Badge>
                                    </div>
                                    <CardContent className="p-4">
                                        <p className="text-sm font-bold text-white leading-relaxed">{item.description}</p>

                                        <button
                                            onClick={() => openGps(`${item.description} em ${data.show.city}`)}
                                            className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-white transition-colors"
                                        >
                                            <Navigation className="h-3 w-3" />
                                            Traçar Rota GPS
                                        </button>
                                    </CardContent>
                                </Card>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center bg-slate-900/20 rounded-2xl border border-dashed border-white/5">
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Nenhuma logística cadastrada.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer de Suporte */}
            <footer className="mt-12 px-8 text-center space-y-4">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Gerado automaticamente por <span className="text-white italic">ManagerShow</span>
                </p>
            </footer>
        </div>
    );
}
