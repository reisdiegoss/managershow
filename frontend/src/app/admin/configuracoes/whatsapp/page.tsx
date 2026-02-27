'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    MessageSquare,
    ShieldCheck,
    Zap,
    Key,
    Globe,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff,
    RefreshCw,
    LogOut,
    QrCode,
    PlusCircle,
    X
} from 'lucide-react';
import { useApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const whatsappSchema = z.object({
    is_whatsapp_active: z.boolean(),
    evolution_api_url: z.string().url("URL inválida").min(1, "URL é obrigatória"),
    evolution_api_key: z.string().min(1, "API Key é obrigatória"),
    evolution_instance_name: z.string().min(1, "Nome da instância é obrigatório")
});

type WhatsAppFormValues = z.infer<typeof whatsappSchema>;

type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'NOT_FOUND' | 'ERROR' | 'NOT_CONFIGURED';

export default function WhatsAppSettingsPage() {
    const { api, getWhatsAppQR, createWhatsAppInstance, logoutWhatsApp } = useApi();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [status, setStatus] = useState<ConnectionStatus>('NOT_CONFIGURED');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    const form = useForm<WhatsAppFormValues>({
        resolver: zodResolver(whatsappSchema),
        defaultValues: {
            is_whatsapp_active: false,
            evolution_api_url: '',
            evolution_api_key: '',
            evolution_instance_name: ''
        }
    });

    const loadSettings = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await api.get('/retaguarda/settings/whatsapp');
            const data = response.data;

            form.reset({
                is_whatsapp_active: !!data.is_whatsapp_active,
                evolution_api_url: data.evolution_api_url || '',
                evolution_api_key: data.evolution_api_key || '',
                evolution_instance_name: data.evolution_instance_name || ''
            });

            setStatus(data.status || 'NOT_CONFIGURED');

            // Se o status virou CONNECTED e o modal estava aberto, fecha
            if (data.status === 'CONNECTED' && isQrModalOpen) {
                setIsQrModalOpen(false);
                setQrCode(null);
                toast({
                    title: "WhatsApp Conectado!",
                    description: "Sua instância está pronta para uso.",
                    className: "bg-emerald-500 border-none text-white font-bold"
                });
            }
        } catch (error: any) {
            if (!silent) {
                const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
                toast({
                    title: isTimeout ? "Tempo esgotado" : "Erro ao carregar",
                    description: isTimeout
                        ? "A Evolution API está demorando para responder. Tente atualizar o status manualmente."
                        : "Não foi possível buscar as configurações.",
                    variant: "destructive"
                });
                if (isTimeout) setStatus('ERROR');
            }
        } finally {
            if (!silent) setLoading(false);
        }
    }, [api, isQrModalOpen, toast, form]);

    useEffect(() => {
        loadSettings();
    }, []);

    // Polling de status quando o modal de QR Code está aberto
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isQrModalOpen && status !== 'CONNECTED') {
            interval = setInterval(() => {
                loadSettings(true);
            }, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isQrModalOpen, status, loadSettings]);

    const handleSave = async (data: WhatsAppFormValues) => {
        try {
            setSaving(true);
            await api.patch('/retaguarda/settings/whatsapp', data);
            toast({
                title: "Configurações salvas!",
                description: "Credenciais atualizadas com sucesso.",
                className: "bg-emerald-500 border-none text-white font-bold"
            });
            loadSettings(true);
        } catch (error) {
            toast({
                title: "Falha ao salvar",
                description: "Verifique os dados e tente novamente.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCreateInstance = async () => {
        try {
            setActionLoading(true);
            await createWhatsAppInstance();
            toast({
                title: "Instância Criada!",
                description: "Gerando QR Code para conexão...",
                className: "bg-emerald-500 border-none text-white font-bold"
            });

            // Recarrega status e tenta abrir o QR imediatamente
            await loadSettings(true);

            // Pequeno delay para garantir que a Evolution API processou a criação antes de pedir o QR
            setTimeout(async () => {
                await handleShowQR();
            }, 1000);

        } catch (error) {
            toast({
                title: "Erro ao criar",
                description: "Não foi possível criar a instância na Evolution API.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleShowQR = async () => {
        try {
            setActionLoading(true);
            const response = await getWhatsAppQR();
            if (response.data.qrcode) {
                setQrCode(response.data.qrcode);
                setIsQrModalOpen(true);
            }
        } catch (error) {
            toast({
                title: "Erro ao gerar QR Code",
                description: "A instância pode estar ocupada ou offline.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!confirm("Deseja realmente desconectar o WhatsApp desta instância?")) return;
        try {
            setActionLoading(true);
            await logoutWhatsApp();
            toast({
                title: "Desconectado!",
                description: "Sessão encerrada com sucesso."
            });
            loadSettings(true);
        } catch (error) {
            toast({
                title: "Erro ao desconectar",
                description: "Não foi possível encerrar a sessão.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <MessageSquare className="h-6 w-6 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                            Configuração <span className="text-emerald-500">WhatsApp</span>
                        </h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => loadSettings()}
                        className="text-slate-500 hover:text-white"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" /> Atualizar Status
                    </Button>
                </div>
                <p className="text-sm font-medium text-slate-400 max-w-2xl">
                    Gestão centralizada da Evolution API v2. Controle instâncias, gere QR Codes e monitore a saúde da integração.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
                        <CardHeader className="border-b border-white/5 bg-emerald-500/5">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap className="h-5 w-5 text-emerald-500" />
                                Credenciais Evolution API
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 mb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold text-white">Envio Global</Label>
                                        <p className="text-xs text-slate-500">Habilita/Desabilita notificações via WhatsApp em todo o SaaS.</p>
                                    </div>
                                    <Switch
                                        checked={form.watch('is_whatsapp_active')}
                                        onCheckedChange={(checked) => form.setValue('is_whatsapp_active', checked)}
                                        className="data-[state=checked]:bg-emerald-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                            <Globe className="h-3 w-3" /> URL da API
                                        </Label>
                                        <Input
                                            {...form.register('evolution_api_url')}
                                            placeholder="https://api.vimasistemas.com.br"
                                            className="bg-slate-950/50 border-white/10 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                            <Zap className="h-3 w-3" /> Nome da Instância
                                        </Label>
                                        <Input
                                            {...form.register('evolution_instance_name')}
                                            placeholder="managershow_main"
                                            className="bg-slate-950/50 border-white/10 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                        <Key className="h-3 w-3" /> Global API Key
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showApiKey ? "text" : "password"}
                                            {...form.register('evolution_api_key')}
                                            className="bg-slate-950/50 border-white/10 rounded-xl pr-10"
                                        />
                                        <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Salvar Configurações
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="glass-card border-white/5 bg-slate-900/40 shadow-xl overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/5">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                                Status Operacional
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Conexão API</span>
                                    {status === 'CONNECTED' ? (
                                        <Badge className="bg-emerald-500/20 text-emerald-500 border-none px-3">CONECTADO</Badge>
                                    ) : status === 'DISCONNECTED' ? (
                                        <Badge className="bg-amber-500/20 text-amber-500 border-none px-3">DESCONECTADO</Badge>
                                    ) : status === 'NOT_FOUND' ? (
                                        <Badge className="bg-rose-500/20 text-rose-500 border-none px-3">NÃO ENCONTRADA</Badge>
                                    ) : (
                                        <Badge className="bg-slate-500/20 text-slate-500 border-none px-3">Pendente</Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Motor de Envio</span>
                                    <Badge variant="outline" className={form.watch('is_whatsapp_active') ? "border-emerald-500/20 text-emerald-500" : "border-white/10 text-slate-500"}>
                                        {form.watch('is_whatsapp_active') ? 'ATIVO' : 'DESLIGADO'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                {status === 'NOT_FOUND' && (
                                    <Button
                                        onClick={handleCreateInstance}
                                        disabled={actionLoading}
                                        className="w-full bg-blue-600 hover:bg-blue-500 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest italic"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : <PlusCircle size={16} className="mr-2" />}
                                        Criar Instância
                                    </Button>
                                )}

                                {(status === 'DISCONNECTED' || status === 'ERROR') && (
                                    <Button
                                        onClick={handleShowQR}
                                        disabled={actionLoading}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 h-14 rounded-xl text-xs font-black uppercase tracking-widest italic shadow-lg shadow-emerald-500/20"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : <QrCode size={18} className="mr-2" />}
                                        Conectar WhatsApp
                                    </Button>
                                )}

                                {status === 'CONNECTED' && (
                                    <div className="space-y-4">
                                        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                                            <div className="p-3 rounded-full bg-emerald-500/20 mb-3 animate-pulse">
                                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                                            </div>
                                            <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">WhatsApp Conectado</span>
                                            <p className="text-[10px] text-emerald-500/60 font-medium mt-1 uppercase tracking-wider">Pronto para envio</p>
                                        </div>
                                        <Button
                                            onClick={handleLogout}
                                            disabled={actionLoading}
                                            variant="outline"
                                            className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest italic"
                                        >
                                            {actionLoading ? <Loader2 className="animate-spin" /> : <LogOut size={16} className="mr-2" />}
                                            Desconectar Instância
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-white/5 bg-slate-900/20 p-6">
                        <div className="flex gap-4 items-start">
                            <div className="p-3 rounded-full bg-blue-500/10">
                                <ShieldCheck className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black uppercase text-white tracking-widest">Segurança de Borda</h4>
                                <p className="text-[10px] text-slate-500 italic">
                                    Todas as notificações são disparadas por um motor isolado. Chaves e tokens são mascarados no tráfego.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Modal QR Code */}
            <Dialog open={isQrModalOpen} onOpenChange={(open) => {
                if (!open) setQrCode(null);
                setIsQrModalOpen(open);
            }}>
                <DialogContent className="sm:max-w-md bg-slate-900 border-white/10 p-0 overflow-hidden rounded-[2rem]">
                    <DialogHeader className="p-8 pb-0 text-center">
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
                            Escaneie o <span className="text-emerald-500">QR Code</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-2">
                            Abra o WhatsApp no seu celular {'>'} Aparelhos Conectados {'>'} Conectar um Aparelho.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col items-center justify-center p-12 pt-8">
                        {qrCode ? (
                            <div className="relative p-6 bg-white rounded-3xl shadow-2xl shadow-emerald-500/10">
                                <img
                                    src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                    alt="QR Code WhatsApp"
                                    className="w-64 h-64 select-none"
                                />
                                {status === 'CONNECTED' && (
                                    <div className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center rounded-3xl animate-in zoom-in duration-300">
                                        <CheckCircle2 size={80} className="text-white" />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-64 h-64 flex items-center justify-center rounded-3xl bg-slate-950/50 border border-white/5 border-dashed">
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-500/30" />
                            </div>
                        )}

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-black uppercase text-emerald-500 tracking-widest animate-pulse">
                                Aguardando Leitura...
                            </span>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-tight">
                                Sincronização automática via Evolution API v2
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-950/50 border-t border-white/5 flex justify-center">
                        <Button variant="ghost" className="text-slate-500 h-10 px-6 rounded-xl hover:text-white" onClick={() => setIsQrModalOpen(false)}>
                            <X size={16} className="mr-2" /> Cancelar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
