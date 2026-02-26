"use client";

import { useState } from "react";
import { Timeline } from "./Timeline";
import { TimelineEvent } from "@/types/show";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useApi } from "@/lib/api";
import {
    Hotel,
    CloudSun,
    UserCircle2,
    MapPin,
    Phone,
    Share2,
    Download,
    CalendarDays,
    Send,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface DaySheetTabProps {
    showId: string;
    artistName: string;
    date: string;
    city: string;
}

// Mock de dados para a Timeline
const mockTimeline: TimelineEvent[] = [
    { id: '1', time: '09:00', title: 'Check-out Hotel Cidade Anterior', icon: 'hotel', description: 'Recepção com bagagens prontas.' },
    { id: '2', time: '10:30', title: 'Transfer para Aeroporto', icon: 'van', description: 'Carrinha Mercedes preta - Placa MS-2026' },
    { id: '3', time: '12:00', title: 'Voo MS-9988 (GRU - SSA)', icon: 'flight', description: 'Assento 12A (Artista) e 14-20 (Equipe)' },
    { id: '4', time: '14:30', title: 'Check-in Hotel Fera SSA', icon: 'hotel', description: 'Centro Histórico - Almoço livre' },
    { id: '5', time: '17:00', title: 'Saída para Passagem de Som', icon: 'van' },
    { id: '6', time: '22:30', title: 'Início do Show', icon: 'music', is_highlight: true, description: 'Duração prevista: 90 minutos' },
    { id: '7', time: '01:00', title: 'Retorno ao Hotel', icon: 'check' },
];

export function DaySheetTab({ showId, artistName, date, city }: DaySheetTabProps) {
    const { toast } = useToast();
    const { api } = useApi();
    const [isPublishing, setIsPublishing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    const handlePublish = async () => {
        setIsPublishing(true);
        try {
            await api.post(`/client/shows/${showId}/daysheet/publish`);
            toast({
                title: "Roteiro Publicado! 🚀",
                description: "A equipe técnica e os músicos foram notificados nos seus celulares via Information Push.",
                variant: "default",
            });
        } catch (error) {
            toast({
                title: "Falha na Publicação",
                description: "Ocorreu um erro ao disparar as notificações. Tente novamente em instantes.",
                variant: "destructive",
            });
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            const response = await api.get(`/client/shows/${showId}/daysheet/pdf`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Roteiro_${city}_${showId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            toast({
                title: "Erro no Download",
                description: "Falha ao gerar o PDF do roteiro pelo Motor Jinja2.",
                variant: "destructive",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleAction = (action: string) => {
        toast({
            title: action,
            description: "Esta funcionalidade estará disponível em breve no próximo ciclo de desenvolvimento.",
        });
    };

    return (
        <div className="space-y-8">
            {/* CTA Principal de Publicação — Information Push UX */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 rounded-[2rem] glass-morphism border border-emerald-500/20 bg-emerald-500/5 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                        <Send className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-slate-100 uppercase italic">Pronto para a Estrada?</h4>
                        <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Dispare o roteiro para toda a equipe</p>
                    </div>
                </div>
                <Button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="w-full md:w-auto rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all h-14 px-8 text-xs font-black uppercase tracking-widest"
                >
                    {isPublishing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Disparando notificações...
                        </>
                    ) : (
                        <>
                            <Send className="mr-2 h-4 w-4" />
                            Publicar e Notificar Equipe
                        </>
                    )}
                </Button>
            </div>

            {/* Header Dark do Roteiro */}
            <div className="rounded-[2rem] bg-slate-900 p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
                            <CalendarDays className="h-4 w-4" /> Roteiro de Produção
                        </div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                            {artistName} <span className="text-indigo-500">Day Sheet</span>
                        </h2>
                        <p className="text-sm font-bold text-slate-400 italic">
                            {format(new Date(date), "dd 'de' MMMM", { locale: ptBR })} — {city}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => handleAction("Compartilhamento com Equipe")}
                            className="rounded-2xl glass-morphism hover:bg-white/10 text-white border-0 text-[10px] font-black uppercase tracking-widest px-6"
                        >
                            <Share2 className="mr-2 h-4 w-4" /> Partilhar
                        </Button>
                        <Button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-6 shadow-lg shadow-indigo-500/20"
                        >
                            {isDownloading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...</>
                            ) : (
                                <><Download className="mr-2 h-4 w-4" /> Baixar PDF</>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Efeito Visual de Fundo */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            {/* Quick Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-white/5 p-6 space-y-4 shadow-xl glass-card transition-all">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/10 p-3 rounded-2xl">
                            <Hotel className="h-5 w-5 text-indigo-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hospedagem</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-100 italic uppercase tracking-tight">Hotel Fera Salvador</p>
                        <p className="text-[11px] font-medium text-slate-500 truncate italic">R. do Chile, 20 - Centro Histórico</p>
                        <Link href="https://maps.google.com" className="text-[9px] font-black uppercase text-indigo-600 hover:underline">Ver no Mapa</Link>
                    </div>
                </Card>

                <Card className="rounded-[2rem] border-white/5 p-6 space-y-4 shadow-xl glass-card transition-all">
                    <div className="flex items-center gap-3">
                        <div className="bg-amber-500/10 p-3 rounded-2xl">
                            <CloudSun className="h-5 w-5 text-amber-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Clima & Dress Code</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-100 italic uppercase tracking-tight">Sol com Nuvens — 28ºC</p>
                        <p className="text-[11px] font-medium text-slate-500 italic">Uniforme Show: Preto / All Black</p>
                    </div>
                </Card>

                <Card className="rounded-[2rem] border-white/5 p-6 space-y-4 shadow-xl glass-card transition-all">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-3 rounded-2xl">
                            <UserCircle2 className="h-5 w-5 text-emerald-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contato Local</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-slate-100 italic uppercase tracking-tight">Ricardo Produções</p>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 italic">
                            <Phone className="h-3 w-3" /> (71) 99988-7766
                        </div>
                    </div>
                </Card>
            </div>

            {/* Timeline Section */}
            <div className="glass-card rounded-[2.5rem] p-8 md:p-12 shadow-2xl">

                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-100 mb-12 italic border-b border-white/5 pb-4">
                    Linha do Tempo <span className="text-indigo-400">Oficial</span>
                </h3>
                <Timeline events={mockTimeline} />
            </div>
        </div>
    );
}

