'use client';

import React, { useEffect, useState } from 'react';
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
    EyeOff
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const whatsappSchema = z.object({
    is_whatsapp_active: z.boolean(),
    evolution_api_url: z.string().url("URL inválida").min(1, "URL é obrigatória").nullable(),
    evolution_api_key: z.string().min(1, "API Key é obrigatória").nullable(),
    evolution_instance_name: z.string().min(1, "Nome da instância é obrigatório").nullable()
});

type WhatsAppFormValues = {
    is_whatsapp_active: boolean;
    evolution_api_url: string | null;
    evolution_api_key: string | null;
    evolution_instance_name: string | null;
};

export default function WhatsAppSettingsPage() {
    const { api } = useApi();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
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

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/retaguarda/settings/whatsapp');
            form.reset({
                is_whatsapp_active: response.data.is_whatsapp_active,
                evolution_api_url: response.data.evolution_api_url || '',
                evolution_api_key: response.data.evolution_api_key || '',
                evolution_instance_name: response.data.evolution_instance_name || ''
            });
        } catch (error) {
            toast({
                title: "Erro ao carregar configurações",
                description: "Não foi possível buscar as credenciais do WhatsApp.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: WhatsAppFormValues) => {
        try {
            setSaving(true);
            await api.patch('/retaguarda/settings/whatsapp', data);
            toast({
                title: "Configurações salvas!",
                description: "As credenciais do WhatsApp foram atualizadas com sucesso.",
                className: "bg-emerald-500 border-none text-white font-bold"
            });
        } catch (error) {
            toast({
                title: "Falha ao salvar",
                description: "Ocorreu um erro ao tentar salvar as configurações.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const testConnection = async () => {
        try {
            setTesting(true);
            await api.post('/retaguarda/settings/whatsapp/test');
            toast({
                title: "Conexão estabelecida!",
                description: "A API respondeu corretamente aos testes.",
                className: "bg-emerald-500 border-none text-white font-bold"
            });
        } catch (error) {
            toast({
                title: "Falha na conexão",
                description: "Verifique a URL, a API Key e se a instância está rodando.",
                variant: "destructive"
            });
        } finally {
            setTesting(false);
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
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <MessageSquare className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                        Configuração <span className="text-emerald-500">WhatsApp</span>
                    </h1>
                </div>
                <p className="text-sm font-medium text-slate-400 max-w-2xl">
                    Configure as credenciais da Evolution API para o motor de disparo centralizado.
                    Todas as notificações automáticas do SaaS utilizarão esta instância.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário Principal */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card border-white/5 shadow-2xl overflow-hidden">
                        <CardHeader className="border-b border-white/5 bg-emerald-500/5">
                            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                                <Zap className="h-5 w-5 text-emerald-500" />
                                Credenciais Evolution API
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                Informe o endpoint e as chaves de acesso fornecidas pela Vima Sistemas.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Status Toggle */}
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-white/5 mb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold text-white">Status da Integração</Label>
                                        <p className="text-xs text-slate-500">Ativa ou desativa o envio global de mensagens.</p>
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
                                            className="bg-slate-950/50 border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                        />
                                        {form.formState.errors.evolution_api_url && (
                                            <p className="text-[10px] text-red-400 font-bold">{form.formState.errors.evolution_api_url.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                                            <Zap className="h-3 w-3" /> Nome da Instância
                                        </Label>
                                        <Input
                                            {...form.register('evolution_instance_name')}
                                            placeholder="managershow_oficial"
                                            className="bg-slate-950/50 border-white/10 rounded-xl focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                        />
                                        {form.formState.errors.evolution_instance_name && (
                                            <p className="text-[10px] text-red-400 font-bold">{form.formState.errors.evolution_instance_name.message}</p>
                                        )}
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
                                            placeholder="SuachaveAqui_Evolution"
                                            className="bg-slate-950/50 border-white/10 rounded-xl pr-10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                        >
                                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {form.formState.errors.evolution_api_key && (
                                        <p className="text-[10px] text-red-400 font-bold">{form.formState.errors.evolution_api_key.message}</p>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-4 border-t border-white/5">
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                        Salvar Configurações
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={testing}
                                        onClick={testConnection}
                                        className="px-6 border-white/10 hover:bg-white/5 text-slate-300 font-bold uppercase text-[10px] tracking-widest rounded-xl"
                                    >
                                        {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                        Testar Conexão
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar com informações */}
                <div className="space-y-6">
                    <Card className="glass-card border-white/5 shadow-xl bg-slate-900/30">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-500 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Segurança de Borda
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                                Estas configurações são <span className="text-white font-bold">globais</span>. Produtoras e usuários finais não têm acesso a estes dados. O sistema mascara as chaves durante o tráfego de rede para garantir conformidade técnica.
                            </p>
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Aviso Importante</span>
                                <p className="text-[10px] text-slate-500 mt-2 leading-relaxed italic">
                                    Ao ativar o status, todos os envios de "Day Sheet" (Roteiros) e links de acesso serão disparados para o WhatsApp da equipe do artista via instância central.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-white/5 shadow-xl bg-slate-900/30">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-emerald-500 animate-pulse" /> Status Operacional
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">API Endpoint</span>
                                    <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[9px]">ONLINE</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Envio Global</span>
                                    <Badge variant="outline" className={form.watch('is_whatsapp_active') ? "border-emerald-500/20 text-emerald-500 text-[9px]" : "border-red-500/20 text-red-500 text-[9px]"}>
                                        {form.watch('is_whatsapp_active') ? 'ATIVO' : 'PAUSADO'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
