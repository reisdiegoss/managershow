'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Building2,
    ShieldAlert,
    ShieldCheck,
    Users,
    HardDrive,
    CreditCard,
    FileText,
    Settings2,
    Save,
    Loader2,
    UserCircle2,
    ExternalLink,
    Ban,
    RefreshCw,
    Search,
    MapPin,
    X,
    Activity,
    MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAdminApi } from '@/lib/api/useAdminApi';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

export default function TenantDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { api, getAdminTenant, suspendAdminTenant, updateAdminTenant, updateAdminTenantFeatures, impersonateAdminTenant } = useAdminApi();

    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Form states
    const [editFormData, setEditFormData] = useState<any>({
        name: '',
        document: '',
        cnpj: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        plan_id: '',
        email: '',
        phone: '',
        contact_name: '',
        contact_phone: '',
        users_limit: 5,
        storage_limit_gb: 10,
        whatsapp_limit: 1,
        account_type: 'ARTIST'
    });

    const [plans, setPlans] = useState<any[]>([]);
    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [isSearchingStreet, setIsSearchingStreet] = useState(false);
    const [streetSuggestions, setStreetSuggestions] = useState<any[]>([]);
    const [streetSearchTerm, setStreetSearchTerm] = useState('');

    useEffect(() => {
        if (id) {
            loadTenantData();
        }
    }, [id]);

    const loadTenantData = async () => {
        try {
            setLoading(true);
            const [tenantRes, plansRes] = await Promise.all([
                getAdminTenant(id as string),
                api.get('/retaguarda/plans') // Carregar planos disponíveis
            ]);

            const data = tenantRes.data;
            setTenant(data);
            setEditFormData({
                name: data.name,
                document: data.document || '',
                cnpj: data.cnpj || '',
                cep: data.cep || '',
                street: data.street || '',
                number: data.number || '',
                complement: data.complement || '',
                neighborhood: data.neighborhood || '',
                city: data.city || '',
                state: data.state || '',
                plan_id: data.plan_id || '',
                email: data.email || '',
                phone: data.phone || '',
                contact_name: data.contact_name || '',
                contact_phone: data.contact_phone || '',
                users_limit: data.users_limit,
                storage_limit_gb: data.storage_limit_gb || 10,
                whatsapp_limit: data.whatsapp_limit || 1,
                account_type: data.account_type || 'ARTIST'
            });
            setStreetSearchTerm(data.street || '');

            if (plansRes.data) {
                setPlans(plansRes.data.items || plansRes.data);
            }
        } catch (error) {
            console.error("Erro ao carregar dados do tenant:", error);
            toast({
                title: "Erro de Conexão",
                description: "Não foi possível carregar os dados deste cliente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Lógica de busca de endereço - Sincronizada com o modal
    const searchAddressGlobally = async (query: string) => {
        try {
            setIsSearchingStreet(true);
            let fullQuery = query;
            if (editFormData.city) fullQuery += `, ${editFormData.city}`;
            if (editFormData.state) fullQuery += `, ${editFormData.state}`;
            fullQuery += ", Brasil";

            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&countrycodes=br&addressdetails=1&limit=8`, {
                headers: { 'User-Agent': 'ManagerShow-Admin/1.0' }
            });
            const data = await response.json();
            setStreetSuggestions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro na busca global:", error);
        } finally {
            setIsSearchingStreet(false);
        }
    };

    const handleCepChange = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setEditFormData((prev: any) => ({ ...prev, cep: cleanCep }));

        if (cleanCep.length === 8) {
            try {
                setIsSearchingCep(true);
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setEditFormData((prev: any) => ({
                        ...prev,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    }));
                    setStreetSearchTerm(data.logradouro);
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            } finally {
                setIsSearchingCep(false);
            }
        }
    };

    const manualStreetSearch = () => {
        if (editFormData.city && editFormData.state && editFormData.street.length >= 3) {
            // Busca simplificada ViaCEP por logradouro se tiver cidade/uf
            fetch(`https://viacep.com.br/ws/${editFormData.state}/${editFormData.city}/${editFormData.street}/json/`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) setStreetSuggestions(data.map((d: any) => ({
                        display_name: `${d.logradouro}, ${d.bairro}, ${d.localidade}`,
                        address: { road: d.logradouro, suburb: d.bairro, city: d.localidade, state: d.uf, postcode: d.cep }
                    })));
                    else searchAddressGlobally(streetSearchTerm);
                }).catch(() => searchAddressGlobally(streetSearchTerm));
        } else {
            searchAddressGlobally(streetSearchTerm);
        }
    };

    const handleSuspend = async () => {
        try {
            setActionLoading(true);
            await suspendAdminTenant(id as string);
            toast({
                title: tenant.is_suspended ? "Acesso Reativado" : "Acesso Suspenso",
                description: `O cliente ${tenant.name} teve seu status atualizado.`,
            });
            loadTenantData();
        } catch (error) {
            toast({
                title: "Falha na operação",
                description: "Erro ao tentar alterar o status do cliente.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleImpersonate = async () => {
        try {
            setActionLoading(true);
            const response = await impersonateAdminTenant(id as string);
            toast({
                title: "Redirecionando...",
                description: response.data?.message || "Iniciando sessão espelhada.",
            });
            if (response.data?.impersonation_url) {
                window.open(response.data.impersonation_url, '_blank');
            }
        } catch (error) {
            toast({
                title: "Erro de Autenticação",
                description: "Não foi possível iniciar o Modo God para este cliente.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const saveChanges = async () => {
        try {
            setActionLoading(true);

            // Normalizar para evitar 422
            const submitData = {
                ...editFormData,
                plan_id: editFormData.plan_id === '' ? null : editFormData.plan_id
            };

            await updateAdminTenant(id as string, submitData);
            toast({ title: "Sucesso!", description: "Dados atualizados com sucesso." });
            loadTenantData();
        } catch (error: any) {
            console.error("Erro ao salvar:", error);
            const detail = error.response?.data?.detail;
            let msg = "Não foi possível salvar as alterações.";
            if (Array.isArray(detail)) msg = detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(' | ');

            toast({
                title: "Erro ao salvar",
                description: msg,
                variant: "destructive"
            });
        } finally {
            setActionLoading(false);
        }
    };

    const applyStreetSuggestion = (suggestion: any) => {
        const addr = suggestion.address;
        const stateName = addr.state || '';
        const UF_MAP: any = { 'São Paulo': 'SP', 'Rio de Janeiro': 'RJ', 'Minas Gerais': 'MG', 'Bahia': 'BA' }; // Simplificado para o exemplo
        const uf = UF_MAP[stateName] || stateName;

        setEditFormData((prev: any) => ({
            ...prev,
            cep: (addr.postcode || '').replace(/\D/g, ''),
            street: addr.road || addr.pedestrian || suggestion.display_name.split(',')[0],
            neighborhood: addr.suburb || addr.neighbourhood || '',
            city: addr.city || addr.town || '',
            state: uf.substring(0, 2).toUpperCase()
        }));
        setStreetSuggestions([]);
        setStreetSearchTerm(addr.road || addr.pedestrian || suggestion.display_name.split(',')[0]);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/admin/tenants')}
                        className="rounded-lg hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Voltar
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                                {tenant.name}
                            </h1>
                            <Badge className={cn(
                                "text-xs font-bold py-1 px-3 border transition-colors",
                                tenant.is_suspended
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            )}>
                                {tenant.is_suspended ? 'Suspenso' : 'Ativo'}
                            </Badge>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground mt-2">
                            ID: <span className="font-mono text-xs">{tenant.id}</span> • Registrado em {new Date(tenant.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleImpersonate}
                        disabled={actionLoading}
                        variant="outline"
                        className="rounded-lg border-border h-11 px-5 font-semibold hover:bg-muted transition-all"
                    >
                        <UserCircle2 className="mr-2 h-5 w-5 text-muted-foreground" /> Modo God
                    </Button>
                    <Button
                        onClick={handleSuspend}
                        disabled={actionLoading}
                        className={cn(
                            "rounded-lg h-11 px-5 font-semibold shadow-sm transition-all border-0",
                            tenant.is_suspended
                                ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                                : "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20"
                        )}
                    >
                        {actionLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                            tenant.is_suspended ? <><RefreshCw className="mr-2 h-5 w-5" /> Reativar Conta</> : <><Ban className="mr-2 h-5 w-5" /> Suspender Conta</>
                        )}
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="ficha" className="w-full">
                <TabsList className="bg-muted p-1 rounded-xl mb-6 w-fit grid grid-cols-3">
                    <TabsTrigger value="ficha" className="rounded-md px-8 py-2 font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <FileText className="mr-2 h-4 w-4" /> Dados Gerais
                    </TabsTrigger>
                    <TabsTrigger value="limites" className="rounded-md px-8 py-2 font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <Settings2 className="mr-2 h-4 w-4" /> Plano e Limites
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" className="rounded-md px-8 py-2 font-semibold data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <CreditCard className="mr-2 h-4 w-4" /> Faturamento
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="ficha" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-foreground">Endereço de Correspondência</h3>
                                <CardDescription className="text-muted-foreground">Localização oficial para faturamento e contratos.</CardDescription>
                            </div>

                            <div className="grid grid-cols-6 gap-4">
                                {/* Row 1: Logradouro e CEP */}
                                <div className="col-span-4 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logradouro</Label>
                                    <div className="relative">
                                        <Input
                                            value={streetSearchTerm}
                                            onChange={(e) => {
                                                setStreetSearchTerm(e.target.value);
                                                setEditFormData((prev: any) => ({ ...prev, street: e.target.value }));
                                            }}
                                            placeholder="Nome da rua..."
                                            className="rounded-lg border-border bg-background h-11 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={manualStreetSearch}
                                            title="Buscar rua (Azul para dinâmico)"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                            <Search size={18} />
                                        </button>

                                        {streetSuggestions.length > 0 && (
                                            <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-popover border border-border rounded-lg shadow-xl max-h-[250px] overflow-y-auto p-2 text-foreground">
                                                <div className="flex items-center justify-between p-2 sticky top-0 bg-popover border-b border-border mb-1">
                                                    <span className="text-xs font-bold text-muted-foreground">Sugestões</span>
                                                    <button type="button" onClick={() => setStreetSuggestions([])} className="hover:text-primary transition-colors"><X size={14} /></button>
                                                </div>
                                                {streetSuggestions.map((s, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => applyStreetSuggestion(s)}
                                                        className="p-3 hover:bg-muted rounded-md cursor-pointer transition-colors border-b border-border/10 last:border-0"
                                                    >
                                                        <p className="text-xs font-bold leading-tight">
                                                            {s.address.road || s.address.pedestrian || s.display_name.split(',')[0]}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground font-medium mt-1">
                                                            {s.address.suburb || s.address.neighbourhood || ''} {s.address.city || ''}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CEP</Label>
                                    <div className="relative">
                                        <Input
                                            value={editFormData.cep}
                                            onChange={(e) => handleCepChange(e.target.value)}
                                            placeholder="00000-000"
                                            className="rounded-lg border-border bg-background h-11 pr-10 font-medium tabular-nums"
                                            maxLength={9}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleCepChange(editFormData.cep)}
                                            title="Buscar CEP (Verde para instantâneo)"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 hover:text-green-600 transition-colors"
                                        >
                                            <Search size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Row 2: UF, Cidade e Número */}
                                <div className="col-span-1 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">UF</Label>
                                    <Input
                                        value={editFormData.state}
                                        onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value.toUpperCase() })}
                                        maxLength={2}
                                        className="rounded-lg border-border bg-background h-11 font-semibold text-center uppercase"
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade</Label>
                                    <Input
                                        value={editFormData.city}
                                        onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                        className="rounded-lg border-border bg-background h-11"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nº</Label>
                                    <Input
                                        value={editFormData.number}
                                        onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                                        className="rounded-lg border-border bg-background h-11 font-medium tabular-nums"
                                    />
                                </div>

                                {/* Row 3: Bairro e Complemento */}
                                <div className="col-span-3 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bairro</Label>
                                    <Input
                                        value={editFormData.neighborhood}
                                        onChange={(e) => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                                        className="rounded-lg border-border bg-background h-11"
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complemento</Label>
                                    <Input
                                        value={editFormData.complement}
                                        onChange={(e) => setEditFormData({ ...editFormData, complement: e.target.value })}
                                        className="rounded-lg border-border bg-background h-11"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-foreground">Acesso e Contato</h3>
                                <CardDescription className="text-muted-foreground">Dados de identificação e contato principal.</CardDescription>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CNPJ / CPF</Label>
                                    <Input
                                        value={editFormData.cnpj || editFormData.document}
                                        onChange={(e) => setEditFormData({ ...editFormData, cnpj: e.target.value })}
                                        className="rounded-lg border-border bg-background h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Conta</Label>
                                    <Select
                                        value={editFormData.account_type}
                                        onValueChange={(val) => setEditFormData({ ...editFormData, account_type: val })}
                                    >
                                        <SelectTrigger className="h-11 rounded-lg">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ARTIST">Artista (Individual)</SelectItem>
                                            <SelectItem value="AGENCY">Escritório / Agência (Casting)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground italic">Isso altera os módulos visíveis no Dashboard do cliente.</p>
                                </div>
                            </div>

                            <Button onClick={saveChanges} disabled={actionLoading} className="w-full rounded-lg bg-primary text-primary-foreground h-11 font-semibold shadow-sm hover:bg-primary/90 transition-all">
                                {actionLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="mr-2 h-5 w-5" /> Salvar Alterações</>}
                            </Button>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="limites" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="rounded-xl border border-border bg-card p-6 space-y-6 lg:col-span-2 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-foreground">Plano & Limites Operacionais</h3>
                                    <CardDescription className="text-muted-foreground">Gerencie a capacidade e módulos ativos deste cliente.</CardDescription>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                            <CreditCard size={14} className="text-primary" /> Selecionar Plano Base
                                        </Label>
                                        <Select
                                            value={editFormData.plan_id}
                                            onValueChange={(val) => {
                                                const selectedPlan = plans.find(p => p.id === val);
                                                setEditFormData((prev: any) => ({
                                                    ...prev,
                                                    plan_id: val,
                                                    users_limit: selectedPlan?.add_users || prev.users_limit,
                                                    storage_limit_gb: selectedPlan?.add_storage_gb || prev.storage_limit_gb,
                                                    whatsapp_limit: selectedPlan?.add_whatsapp || prev.whatsapp_limit
                                                }));
                                            }}
                                        >
                                            <SelectTrigger className="w-full rounded-lg border-border h-11 font-medium bg-background">
                                                <SelectValue placeholder="Selecione um plano..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-lg border-border shadow-xl">
                                                {plans.map((p) => (
                                                    <SelectItem key={p.id} value={p.id} className="rounded-md px-4 py-3 cursor-pointer">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold">{p.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                R$ {p.price}/mês • {p.max_users} usuários
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold text-foreground">Limite de Usuários</Label>
                                                <p className="text-xs text-muted-foreground">Modificável sob demanda</p>
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            value={editFormData.users_limit}
                                            onChange={(e) => setEditFormData((prev: any) => ({ ...prev, users_limit: parseInt(e.target.value) }))}
                                            className="w-20 text-center rounded-lg bg-background border-border font-bold text-primary h-11"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                <HardDrive size={20} />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold text-foreground">Armazenamento (GB)</Label>
                                                <p className="text-xs text-muted-foreground">Capacidade em disco</p>
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            value={editFormData.storage_limit_gb}
                                            onChange={(e) => setEditFormData((prev: any) => ({ ...prev, storage_limit_gb: parseInt(e.target.value) }))}
                                            className="w-20 text-center rounded-lg bg-background border-border font-bold text-primary h-11"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                                                <MessageSquare size={20} />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-bold text-foreground">WhatsApp API</Label>
                                                <p className="text-xs text-muted-foreground">Instâncias simultâneas</p>
                                            </div>
                                        </div>
                                        <Input
                                            type="number"
                                            value={editFormData.whatsapp_limit}
                                            onChange={(e) => setEditFormData((prev: any) => ({ ...prev, whatsapp_limit: parseInt(e.target.value) }))}
                                            className="w-20 text-center rounded-lg bg-background border-border font-bold text-primary h-11"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">Módulos Opcionais</h4>

                                    {[
                                        { id: 'kanban', label: 'CRM Kanban', icon: RefreshCw },
                                        { id: 'whatsapp', label: 'API WhatsApp', icon: ExternalLink },
                                        { id: 'analytics', label: 'Analytics Pro', icon: Activity },
                                    ].map((feat) => (
                                        <div key={feat.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <feat.icon size={16} className="text-muted-foreground" />
                                                <span className="text-sm font-semibold text-foreground leading-none">{feat.label}</span>
                                            </div>
                                            <Switch
                                                checked={editFormData.feature_toggles?.[feat.id] === true}
                                                onCheckedChange={(checked) => setEditFormData((prev: any) => ({
                                                    ...prev,
                                                    feature_toggles: { ...prev.feature_toggles, [feat.id]: checked }
                                                }))}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={saveChanges} disabled={actionLoading} className="w-full rounded-lg bg-primary text-primary-foreground h-11 font-semibold shadow-sm hover:bg-primary/90 transition-all">
                                {actionLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <><Save className="mr-2 h-5 w-5" /> Atualizar Plano & Recursos</>}
                            </Button>
                        </Card>

                        <Card className="rounded-xl border border-border bg-muted/50 text-foreground p-6 relative overflow-hidden flex flex-col justify-between shadow-sm">
                            <div className="absolute top-0 right-0 p-6 opacity-5">
                                <Settings2 size={120} />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-lg font-bold tracking-tight">Audit Log</h3>
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Histórico SaaS</p>

                                <div className="space-y-4">
                                    <div className="text-xs flex flex-col gap-1 text-muted-foreground">
                                        <p className="text-foreground font-medium opacity-70">27/02 - 14:10</p>
                                        <p>Alteração: [Limite de Usuários] 5 → 10</p>
                                    </div>
                                    <div className="text-xs flex flex-col gap-1 text-muted-foreground">
                                        <p className="text-foreground font-medium opacity-70">25/02 - 09:45</p>
                                        <p>Recurso: módulo [API WhatsApp] habilitado</p>
                                    </div>
                                </div>
                            </div>

                            <Button variant="outline" className="relative z-10 w-full rounded-lg border-border hover:bg-background mt-8 text-xs font-bold uppercase tracking-wider">
                                Ver Log Completo
                            </Button>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="financeiro" className="space-y-6">
                    <Card className="rounded-xl border border-border bg-card p-6 space-y-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-foreground">Faturas & Pagamentos</h3>
                                <CardDescription className="text-muted-foreground">Histórico de cobranças integrado ao Asaas.</CardDescription>
                            </div>
                            <Button variant="outline" className="rounded-lg border-border h-10 px-4 font-semibold hover:bg-muted transition-colors">
                                <RefreshCw className="mr-2 h-4 w-4 text-muted-foreground" /> Sincronizar Asaas
                            </Button>
                        </div>

                        <div className="rounded-lg border border-border overflow-hidden">
                            <table className="w-full text-left bg-card">
                                <thead className="bg-muted/30 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">ID Fatura</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Vencimento</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-muted-foreground tracking-wider">Valor</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-muted-foreground tracking-wider text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase text-muted-foreground tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-muted-foreground">#ASA-2026-001</td>
                                        <td className="px-6 py-4 text-sm font-medium">{new Date().toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">R$ 299,90</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-bold">Pago</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
                                                <ExternalLink size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs font-medium text-muted-foreground">#ASA-2026-002</td>
                                        <td className="px-6 py-4 text-sm font-medium">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-primary">R$ 299,90</td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">Agendado</Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
                                                <ExternalLink size={16} />
                                            </Button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
