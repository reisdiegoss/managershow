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
import { cn } from "@/lib/utils";
import { FinancialTransaction } from "@/types/finance";
import { LogisticsTable } from "./LogisticsTable";
import { AddLogisticsCostModal } from "./AddLogisticsCostModal";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { DaySheetTab } from "./DaySheetTab";
import { TeamCheckin } from "./TeamCheckin";
import PreShowCrew from "./PreShowCrew";
import { QuickExpenseForm } from "./QuickExpenseForm";
import { FinanceTab } from "./FinanceTab";
import { Truck, Users, RefreshCw } from "lucide-react";
import { TeamMember, DiariaType, CacheType } from "@/types/show";
import { GenerateDocumentModal } from "./GenerateDocumentModal";
import { DocumentTemplate } from "@/types/document";
import { sync } from "@/lib/db/syncService";
import { CheckInList } from "./CheckInList";

interface ShowDetailsClientProps {
    showId: string;
}

const mockTeam: TeamMember[] = [
    { id: '1', name: 'Diego Reis', role: 'Road Manager', isPresent: true, diaria_type: 'PADRAO', cache_type: 'PENDENTE', is_eventual: false },
    { id: '2', name: 'Alok Petrillo', role: 'Artista', isPresent: true, diaria_type: 'PADRAO', cache_type: 'PENDENTE', is_eventual: false },
    { id: '3', name: 'Zezé Di Camargo', role: 'Vocalista', isPresent: false, diaria_type: 'PADRAO', cache_type: 'PENDENTE', is_eventual: false },
    { id: '4', name: 'Luciano', role: 'Segunda Voz', isPresent: false, diaria_type: 'PADRAO', cache_type: 'PENDENTE', is_eventual: false },
    { id: '5', name: 'Carlos Tech', role: 'Luz & Vídeo', isPresent: true, diaria_type: 'PADRAO', cache_type: 'PENDENTE', is_eventual: false },
];

export function ShowDetailsClient({ showId }: ShowDetailsClientProps) {
    const [show, setShow] = useState<Show | null>(null);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeam);
    const [loading, setLoading] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const { api, updateShowStatus, uploadContract } = useApi();
    const { toast } = useToast();

    const handleSync = async () => {
        try {
            setSyncing(true);
            await sync(api);
            toast({
                title: "Sincronizado!",
                description: "Dados offline atualizados com o servidor.",
                className: "bg-indigo-600 text-white border-0"
            });
            await fetchShowDetails();
            await fetchTransactions();
        } catch (error) {
            toast({
                title: "Erro na Sync",
                description: "Verifique sua conexão ou tente novamente.",
                variant: "destructive"
            });
        } finally {
            setSyncing(false);
        }
    };

    /**
     * Geração de PDF do Contrato
     */
    const handleGeneratePDF = async () => {
        try {
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

    /**
     * Atualização de Status do Show
     */
    const handleStatusChange = async (newStatus: any) => {
        try {
            await updateShowStatus(showId, newStatus);
            toast({ title: "Status Atualizado!", description: `Show marcado como ${newStatus}.` });
            await fetchShowDetails();
        } catch (error) {
            toast({ title: "Erro na atualização", variant: "destructive" });
        }
    };

    /**
     * Upload de Contrato Assinado
     */
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            await uploadContract(showId, file);
            toast({ title: "Upload Concluído!", description: "O contrato assinado foi anexado com sucesso." });
            await fetchShowDetails();
        } catch (error) {
            toast({ title: "Erro no Upload", description: "Falha ao enviar o arquivo para a nuvem.", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };
    const fetchShowDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/client/shows/${showId}`);
            setShow(response.data);
            // Simulação: Se a API retornasse membros da equipe
            // setTeamMembers(response.data.crew || mockTeam);
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

    const fetchTransactions = async () => {
        try {
            setLoadingTransactions(true);
            const response = await api.get(`/client/shows/${showId}/transactions`);
            setTransactions(response.data);
        } catch (error) {
            console.error("Erro ao carregar transações:", error);
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        fetchShowDetails();
        fetchTransactions();
    }, [showId]);

    /**
     * Atualização de membro da equipe com Optimistic UI
     */
    const handleUpdateMember = async (memberId: string, updates: Partial<TeamMember>) => {
        const oldTeam = [...teamMembers];
        setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));

        try {
            // Chamada background para o backend
            // await api.patch(`/client/shows/${showId}/crew/${memberId}`, updates);
        } catch (error) {
            setTeamMembers(oldTeam);
            toast({ title: "Erro na sincronização", description: "Não foi possível salvar as alterações.", variant: "destructive" });
        }
    };

    /**
     * Adição de colaborador eventual
     */
    const handleAddEventual = async (name: string, role: string) => {
        const newMember: TeamMember = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            role,
            isPresent: true,
            diaria_type: 'PADRAO',
            cache_type: 'PENDENTE',
            is_eventual: true
        };
        setTeamMembers(prev => [newMember, ...prev]);

        try {
            // await api.post(`/client/shows/${showId}/crew`, newMember);
        } catch (error) {
            toast({ title: "Erro ao adicionar", variant: "destructive" });
        }
    };

    // Funcionalidades de Equipe Finalizadas
    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!show) return <div className="p-8 text-center text-slate-500">Show não encontrado.</div>;

    const isLocked = ["SONDAGEM", "PROPOSTA", "CONTRATO_PENDENTE"].includes(show.status);

    // Cálculos Financeiros (Módulo de Logística)
    const budgetLimit = show.base_price * 0.15; // 15% do cachê como teto logístico
    const realizedTotal = transactions.reduce((acc, t) => acc + t.realized_amount, 0);
    const balance = budgetLimit - realizedTotal;
    const progressValue = Math.min((realizedTotal / budgetLimit) * 100, 100);

    return (
        <div className="flex flex-col space-y-6">
            {/* Header / KPIs Globais da Produtora */}
            <div className="rounded-[2.5rem] glass-card p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <Link href="/agenda" className="flex items-center text-xs font-black uppercase tracking-widest text-indigo-600 hover:opacity-70 transition-all">
                            <ChevronLeft className="mr-1 h-3 w-3" /> Voltar para Agenda
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-100 leading-none">

                                {show.artist_id} <span className="text-indigo-600">Global Tour</span>
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                                <span className="flex items-center italic"><Calendar className="mr-2 h-4 w-4" /> {format(new Date(show.date_show), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
                                <span className="flex items-center italic uppercase"><MapPin className="mr-2 h-4 w-4" /> {show.location_city}, {show.location_uf}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 text-right">
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full text-[10px] font-black uppercase tracking-widest gap-2 bg-indigo-50/50 border-indigo-100 text-indigo-700 hover:bg-indigo-100"
                            onClick={handleSync}
                            disabled={syncing}
                        >
                            {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Sincronizar Estrada
                        </Button>
                        <Badge className="rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border-indigo-100">
                            {show.status}
                        </Badge>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cachê Base</p>
                            <p className="text-2xl font-black text-slate-100 italic">R$ {show.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

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
                        <TabsTrigger value="roteiro" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-black uppercase tracking-widest py-3 px-1">Roteiro</TabsTrigger>
                        <TabsTrigger value="equipe" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-black uppercase tracking-widest py-3 px-1">Time & Estrada</TabsTrigger>
                        <TabsTrigger value="finance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-[11px] font-black uppercase tracking-widest py-3 px-1">Financeiro</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="rounded-3xl glass-card p-8 shadow-xl">

                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-100 mb-6 italic">Detalhes da Negociação</h3>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo de Contratante</p>
                                        <p className="text-sm font-bold text-slate-700">{show.client_type === "PUBLIC" ? "Governo / Prefeitura" : "Privado / Venda Direta"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modelo de Negócio</p>
                                        <p className="text-sm font-bold text-slate-400 mb-6">Métricas Administrativas de Produtoras Integradas no Sistema</p>
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
                    <div className="space-y-6">
                        {/* Seção de Documentos Dinâmicos */}
                        <div className="rounded-3xl glass-card p-8 shadow-xl space-y-6">

                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-100 italic">Documentos e Propostas</h3>

                                    <p className="text-xs text-slate-500">Selecione um template dinâmico para gerar o documento com os dados do show.</p>
                                </div>
                                <Link href="/templates">
                                    <Button variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-widest gap-2">
                                        <FileText size={14} /> Gerenciar Templates
                                    </Button>
                                </Link>
                            </div>

                            {/* Listagem Dinâmica de Templates para o Show */}
                            <DynamicTemplatesList showId={showId} />
                        </div>

                        {/* Seção de Upload de Contrato Assinado (Legado / Processo de Validação) */}
                        <div className="rounded-3xl glass-card p-8 shadow-xl space-y-8">

                            <div className="space-y-2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-100 italic">Finalização Jurídica</h3>

                                <Label className="text-slate-300">Taxa Padrão da Produtora/Escritório do Contrato (%)</Label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center md:text-left">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload de Arquivo Assinado</p>
                                    <input
                                        type="file"
                                        id="contract-upload"
                                        className="hidden"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileUpload}
                                    />
                                    <div
                                        onClick={() => document.getElementById('contract-upload')?.click()}
                                        className={cn(
                                            "border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4 hover:border-indigo-400 transition-all cursor-pointer",
                                            uploading && "opacity-50 pointer-events-none"
                                        )}
                                    >
                                        <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                                            {uploading ? <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" /> : <Upload className="h-6 w-6 text-indigo-600" />}
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 leading-tight">
                                            {uploading ? "Enviando arquivo..." : "Arraste o arquivo aqui ou clique para selecionar"}
                                        </p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">PDF, JPG (Máx 10MB)</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Validação Ética</p>
                                    <div className="rounded-2xl bg-amber-50 border border-amber-100 p-6 space-y-4">
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            Ao marcar como assinado, o sistema desbloqueia os fluxos logísticos e financeiros.
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
                    </div>
                </TabsContent>

                <TabsContent value="logistics" className="pt-6">
                    {isLocked ? (
                        <Alert variant="destructive" className="rounded-3xl border-rose-100 bg-rose-50 text-rose-900 p-8 shadow-sm">
                            <Lock className="h-8 w-8 text-rose-600" />
                            <div className="ml-4 space-y-2">
                                <AlertTitle className="text-lg font-black italic uppercase tracking-tighter text-rose-900 leading-none">Logística Bloqueada </AlertTitle>
                                <AlertDescription className="text-sm font-medium leading-relaxed max-w-2xl opacity-80">
                                    {show.status === "DONE" || show.status === "PAID"
                                        ? "Este show já teve seu status 'Concluído' ou teve prestação de contas de estrada efetuada. Os números aqui dispostos são faturamento líquido absoluto da produtora e não podem ser maquiados."
                                        : "Ainda pendente de conclusão oficial ou fechamento de gastos de estrada. Os valores nesta página refletem a estimativa / prévia de lucros momentânea da produtora baseada na precificação."}
                                </AlertDescription>
                            </div>
                        </Alert>
                    ) : (
                        <div className="space-y-8">
                            {/* Dashboard de Orçamento */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="rounded-3xl border-slate-100 p-6 shadow-sm space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Teto Orçamentário (15%)</p>
                                    <p className="text-2xl font-black text-slate-900 italic">
                                        R$ {budgetLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </Card>
                                <Card className="rounded-3xl border-slate-100 p-6 shadow-sm space-y-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gasto Realizado</p>
                                    <p className="text-2xl font-black text-indigo-600 italic">
                                        R$ {realizedTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </Card>
                                <Card className={cn(
                                    "rounded-3xl border-slate-100 p-6 shadow-sm space-y-2",
                                    balance >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                                )}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saldo Disponível</p>
                                    <p className={cn(
                                        "text-2xl font-black italic",
                                        balance >= 0 ? "text-emerald-700" : "text-rose-700"
                                    )}>
                                        R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Consumo do Budget</span>
                                            <span className={cn(progressValue > 90 ? "text-rose-600" : "text-indigo-600")}>
                                                {progressValue.toFixed(1)}%
                                            </span>
                                        </div>
                                        <Progress value={progressValue} className="h-2" />
                                    </div>
                                    <AddLogisticsCostModal showId={showId} onSuccess={fetchTransactions} />
                                </div>
                            </div>

                            {/* Tabela de Gestão */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Extrato de Despesas</h3>
                                <LogisticsTable transactions={transactions} loading={loadingTransactions} />
                            </div>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="roteiro" className="pt-6">
                    {/* Aba de Estrada (Day Sheet + Timeline) */}
                    <DaySheetTab show={show} />

                    {/* Nova Seção: Comprovação Fiscal (Apenas para Mercado Público/Show Finalizado) */}
                    {(show.client_type === 'PUBLIC' || show.status === 'DONE') && (
                        <div className="mt-8">
                            <ExecutionMediaGallery showId={showId} initialMedia={show.execution_media || []} />
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="equipe" className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-8">
                            {/* Pré-Show: Escala e Diárias */}
                            <PreShowCrew
                                members={teamMembers}
                                onUpdateMember={handleUpdateMember}
                                onAddEventual={handleAddEventual}
                            />
                        </div>
                        <div className="space-y-8">
                            {/* Fechamento: Check-in Digital Reativo (WatermelonDB) */}
                            <CheckInList showId={showId} />

                            <Card className="rounded-[2.5rem] bg-indigo-900 p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10 space-y-4">
                                    <Truck className="h-8 w-8 text-indigo-400" />
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter">Modo Estrada</h3>
                                    <p className="text-xs font-medium text-indigo-200 leading-relaxed">
                                        Registre recibos de custos imprevistos instantaneamente durante a viagem.
                                    </p>
                                    <QuickExpenseForm showId={showId} onSuccess={fetchTransactions} />
                                </div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 blur-3xl rounded-full" />
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="finance" className="pt-6">
                    <FinanceTab
                        showId={showId}
                        basePrice={show.base_price}
                        transactions={transactions}
                        loading={loadingTransactions}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}

/**
 * Componente Auxiliar para listar templates dinâmicos de Show
 */
function DynamicTemplatesList({ showId }: { showId: string }) {
    const { api } = useApi();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await api.get('/client/documents/templates?entity_type=SHOW');
                setTemplates(response.data);
            } catch (error) {
                console.error("Erro ao carregar templates de show:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, [api]);

    if (loading) return <div className="text-xs text-slate-400 animate-pulse">Buscando templates disponíveis...</div>;

    if (templates.length === 0) return (
        <div className="bg-slate-50 border-2 border-dotted border-slate-200 p-8 rounded-3xl text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum template dinâmico encontrado para shows.</p>
        </div>
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => (
                <Card key={tpl.id} className="p-5 rounded-2xl border-slate-100 shadow-none hover:border-indigo-200 hover:bg-slate-50/50 transition-all group">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <FileText size={18} />
                            </div>
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-indigo-100 text-indigo-500 rounded-lg">Template SaaS</Badge>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-sm font-black italic uppercase text-slate-800 leading-tight">{tpl.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Baseado no Objeto Show</p>
                        </div>
                        <Button
                            onClick={() => setSelectedTemplate(tpl)}
                            size="sm"
                            className="w-full rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                        >
                            Gerar PDF
                        </Button>
                    </div>
                </Card>
            ))}

            <GenerateDocumentModal
                isOpen={!!selectedTemplate}
                onClose={() => setSelectedTemplate(null)}
                template={selectedTemplate}
                entityId={showId}
            />
        </div>
    );
}
