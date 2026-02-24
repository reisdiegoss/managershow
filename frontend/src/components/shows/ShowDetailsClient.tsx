"use client";

import { useState, useEffect } from "react";
import { useApi } from "@/lib/api";
import { Show } from "@/types/show";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ProfitLight } from "@/components/agenda/ProfitLight";
import {
    FileText,
    Upload,
    Lock,
    CheckCircle,
    Calendar,
    MapPin,
    ChevronLeft,
    Loader2,
    AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface ShowDetailsClientProps {
    showId: string;
}

export function ShowDetailsClient({ showId }: ShowDetailsClientProps) {
    const [show, setShow] = useState<Show | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const { api, updateShowStatus } = useApi();
    const { toast } = useToast();

    const fetchShowDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/client/shows/${showId}`);
            setShow(response.data);
        } catch (error) {
            toast({
                title: "Erro ao carregar show",
                description: "Não foi possível carregar os detalhes do evento.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShowDetails();
    }, [showId]);

    const handleGeneratePDF = async () => {
        try {
            // Endpoint fictício base conforme PRD: GET /.../contracts/pdf
            const response = await api.get(`/client/contracts/${showId}/pdf`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Contrato_${show?.artist_id}_${show?.location_city}.pdf`);
            document.body.appendChild(link);
            link.click();
            toast({ title: "PDF Gerado!", description: "A minuta do contrato foi baixada com sucesso." });
        } catch (error) {
            toast({ title: "Erro ao gerar PDF", variant: "destructive" });
        }
    };

    const handleStatusChange = async (newStatus: any) => {
        try {
            await updateShowStatus(showId, newStatus);
            toast({ title: "Status Atualizado!", description: `Show marcado como ${newStatus}.` });
            fetchShowDetails();
        } catch (error) {
            toast({ title: "Erro na atualização", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!show) return <div className="p-8 text-center text-slate-500">Show não encontrado.</div>;

    const isLocked = ["SONDAGEM", "PROPOSTA", "CONTRATO_PENDENTE"].includes(show.status);

    return (
        <div className="flex flex-col space-y-6">
            {/* Header Premium (Hero Section) */}
            <div className="rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <Link href="/agenda" className="flex items-center text-xs font-black uppercase tracking-widest text-indigo-600 hover:opacity-70 transition-all">
                            <ChevronLeft className="mr-1 h-3 w-3" /> Voltar para Agenda
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                                {show.artist_id} <span className="text-indigo-600">Global Tour</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                                <span className="flex items-center italic"><Calendar className="mr-2 h-4 w-4" /> {format(new Date(show.date_show), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                                <span className="flex items-center italic uppercase"><MapPin className="mr-2 h-4 w-4" /> {show.location_city}, {show.location_uf}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 text-right">
                        <Badge className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border-indigo-100">
                            {show.status}
                        </Badge>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cachê Base</p>
                            <p className="text-2xl font-black text-slate-900 italic">R$ {show.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div className="h-6">
                            <ProfitLight score={85} message="Viabilidade Confirmada" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navegação por Abas */}
            <Tabs defaultValue="overview" className="w-full">
                <div className="overflow-x-auto no-scrollbar">
                    <TabsList className="bg-transparent border-b border-slate-200 w-full justify-start rounded-none h-auto p-0 gap-8">
                        <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-black uppercase tracking-widest py-3 px-1">Visão Geral</TabsTrigger>
                        <TabsTrigger value="contract" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-black uppercase tracking-widest py-3 px-1">Contratos</TabsTrigger>
                        <TabsTrigger value="logistics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-black uppercase tracking-widest py-3 px-1">Logística</TabsTrigger>
                        <TabsTrigger value="finance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-black uppercase tracking-widest py-3 px-1">Financeiro</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 italic">Detalhes da Negociação</h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Contratante</p>
                                        <p className="text-sm font-bold text-slate-700">{show.client_type === "PUBLIC" ? "Governo / Prefeitura" : "Privado / Venda Direta"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modelo de Negócio</p>
                                        <p className="text-sm font-bold text-slate-700">{show.negotiation_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="rounded-3xl bg-slate-900 p-8 text-white">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-6 italic text-indigo-400">Timeline Comercial</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-start">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5" />
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest">Sondagem Iniciada</p>
                                            <p className="text-[10px] text-slate-400">Há 2 dias por Diego Reis</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="contract" className="pt-6">
                    <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Módulo de Gestão de Contratos</h3>
                                <p className="text-xs text-slate-500">Emita a minuta padrão ou anexe o documento juridicamente validado.</p>
                            </div>
                            <Button
                                onClick={handleGeneratePDF}
                                className="rounded-2xl bg-indigo-600 text-[10px] font-black uppercase tracking-widest px-8"
                            >
                                <FileText className="mr-2 h-4 w-4" /> Gerar Minuta de Contrato
                            </Button>
                        </div>

                        <Separator className="bg-slate-100" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload de Documento Assinado</p>
                                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4 hover:border-indigo-400 transition-all cursor-pointer">
                                    <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                        <Upload className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-600 leading-tight">Arraste o arquivo aqui ou clique para selecionar</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">PDF, JPG (Máx 10MB)</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Validação Ética</p>
                                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6 space-y-4">
                                    <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                        Ao marcar como assinado, o sistema desbloqueia os fluxos logísticos e financeiros.
                                        Certifique-se de que a assinatura digital ou física foi conferida.
                                    </p>
                                    <Button
                                        onClick={() => handleStatusChange("ASSINADO")}
                                        disabled={show.status === "ASSINADO"}
                                        className="w-full rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"
                                    >
                                        {show.status === "ASSINADO" ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                                        {show.status === "ASSINADO" ? "Contrato Validado" : "Marcar como Assinado"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="logistics" className="pt-6">
                    {isLocked ? (
                        <Alert variant="destructive" className="rounded-3xl border-rose-100 bg-rose-50 text-rose-900 p-8 shadow-sm">
                            <Lock className="h-8 w-8 text-rose-600" />
                            <div className="ml-4 space-y-2">
                                <AlertTitle className="text-lg font-black italic uppercase tracking-tighter text-rose-900 leading-none">Logística Bloqueada </AlertTitle>
                                <AlertDescription className="text-sm font-medium leading-relaxed max-w-2xl opacity-80">
                                    Por motivos de segurança financeira e compliance da agência, a emissão de passagens, hotéis e contratação de vans
                                    está **bloqueada** até que o contrato seja formalizado. Por favor, valide o contrato na aba de Contratos para seguir.
                                </AlertDescription>
                            </div>
                        </Alert>
                    ) : (
                        <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm space-y-4">
                            <div className="flex items-center gap-3 text-emerald-600">
                                <CheckCircle className="h-6 w-6" />
                                <h3 className="text-sm font-black uppercase tracking-widest italic">Logística Desbloqueada</h3>
                            </div>
                            <p className="text-sm font-medium text-slate-500 italic">O pipeline de roteiros e deslocamentos está aberto. Módulo de lançamento em construção...</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="finance" className="pt-6">
                    <div className="rounded-3xl bg-white border border-slate-100 p-8 shadow-sm">
                        <div className="flex items-center gap-3 text-slate-400">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="text-sm font-black uppercase tracking-widest italic">Fluxo Financeiro</h3>
                        </div>
                        <p className="text-sm font-medium text-slate-500 italic mt-4">Aba bloqueada até a fase de Borderô. Aguarde o fechamento do contrato.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
