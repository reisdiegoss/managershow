'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2,
    MoreVertical,
    Plus,
    Search,
    ShieldAlert,
    ShieldCheck,
    CreditCard,
    Ban,
    ExternalLink,
    Users,
    Activity,
    Loader2,
    Save,
    MapPin,
    Settings,
    X
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAdminApi } from '@/lib/api/useAdminApi';
import { SaaSTenant } from '@/types/admin';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const UF_MAP: Record<string, string> = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM', 'Bahia': 'BA',
    'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', 'Goiás': 'GO',
    'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
    'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR', 'Pernambuco': 'PE', 'Piauí': 'PI',
    'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
    'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
    'Sergipe': 'SE', 'Tocantins': 'TO'
};

export default function TenantsAdminPage() {
    const { getAdminTenants, createAdminTenant, updateAdminTenant, impersonateAdminTenant, getAdminBundles } = useAdminApi();
    const router = useRouter();
    const { toast } = useToast();
    const [tenants, setTenants] = useState<SaaSTenant[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Estados do Modal de Edição/Criação
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedTenant, setSelectedTenant] = useState<SaaSTenant | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        document: '',
        cnpj: '',
        address: '', // Campo legado
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        plan_id: '',
        account_type: 'AGENCY' as 'ARTIST' | 'AGENCY',
        email: '',
        phone: '',
        max_users: 5,
        max_storage_gb: 10,
        whatsapp_limit: 0,
        contact_name: '',
        contact_phone: ''
    });

    const [isSearchingCep, setIsSearchingCep] = useState(false);
    const [streetSuggestions, setStreetSuggestions] = useState<any[]>([]);
    const [isSearchingStreet, setIsSearchingStreet] = useState(false);
    const [streetSearchTerm, setStreetSearchTerm] = useState('');

    React.useEffect(() => {
        loadData();
    }, []);

    // Debounce para busca de rua
    React.useEffect(() => {
        if (!streetSearchTerm || streetSearchTerm.length < 3 || modalMode !== 'create' && !isEditModalOpen) {
            if (!streetSearchTerm) setStreetSuggestions([]);
            return;
        }

        const timer = setTimeout(() => {
            // Se já preencheu via seleção, não busca de novo
            if (editFormData.street === streetSearchTerm && streetSuggestions.length === 0) return;
            searchAddressGlobally(streetSearchTerm);
        }, 800);

        return () => clearTimeout(timer);
    }, [streetSearchTerm]);

    const searchAddressGlobally = async (query: string) => {
        try {
            setIsSearchingStreet(true);

            // Refinar busca com UF e Cidade se estiverem preenchidos
            let fullQuery = query;
            if (editFormData.city) fullQuery += `, ${editFormData.city}`;
            if (editFormData.state) fullQuery += `, ${editFormData.state}`;
            fullQuery += ", Brasil";

            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullQuery)}&countrycodes=br&addressdetails=1&limit=8`, {
                headers: {
                    'User-Agent': 'ManagerShow-Admin/1.0 (dev@managershow.com)'
                }
            });
            const data = await response.json();
            setStreetSuggestions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Erro na busca global:", error);
        } finally {
            setIsSearchingStreet(false);
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [tenantsRes, plansRes] = await Promise.all([
                getAdminTenants(),
                getAdminBundles()
            ]);

            if (tenantsRes.data && tenantsRes.data.items) {
                setTenants(tenantsRes.data.items);
            }
            if (plansRes.data) {
                setPlans(plansRes.data.items || plansRes.data);
            }
        } catch (error) {
            console.error("[TenantsPage] Erro ao carregar dados:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (tenant: SaaSTenant) => {
        try {
            setActionLoading(tenant.id);
            const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
            await updateAdminTenant(tenant.id, { status: newStatus });

            toast({
                title: newStatus === 'ACTIVE' ? "Acesso Ativado" : "Acesso Suspenso",
                description: `O status do cliente ${tenant.name} foi atualizado com sucesso.`,
            });

            loadData();
        } catch (error) {
            toast({
                title: "Erro na operação",
                description: "Não foi possível atualizar o status do cliente.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleSimulateAccess = async (tenant: SaaSTenant) => {
        try {
            setActionLoading(tenant.id);
            const response = await impersonateAdminTenant(tenant.id);

            toast({
                title: "Simulação Autorizada",
                description: `Preparando ambiente para ${tenant.name}...`,
            });

            if (response.data?.impersonation_url) {
                window.open(response.data.impersonation_url, '_blank');
            } else {
                // Fallback de desenvolvimento
                router.push(`/?impersonate_tenant_id=${tenant.id}`);
            }
        } catch (error) {
            toast({
                title: "Erro na Simulação",
                description: "Não foi possível autorizar o acesso simulado.",
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedTenant(null);
        setEditFormData({
            name: '',
            document: '',
            cnpj: '',
            address: '',
            cep: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            plan_id: '',
            account_type: 'AGENCY',
            email: '',
            phone: '',
            max_users: 5,
            max_storage_gb: 10,
            whatsapp_limit: 0,
            contact_name: '',
            contact_phone: ''
        });
        setIsEditModalOpen(true);
    };

    const manualCepSearch = () => {
        if (editFormData.cep.length >= 8) {
            handleCepChange(editFormData.cep);
        } else {
            toast({
                title: "CEP incompleto",
                description: "Digite os 8 dígitos do CEP para buscar.",
                variant: "destructive"
            });
        }
    };

    const handleCepChange = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setEditFormData(prev => ({ ...prev, cep: cleanCep }));

        if (cleanCep.length === 8) {
            try {
                setIsSearchingCep(true);
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();

                if (!data.erro) {
                    setEditFormData(prev => ({
                        ...prev,
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    }));
                    setStreetSearchTerm(data.logradouro);
                    // Focar no campo número após preenchimento automático
                    setTimeout(() => {
                        document.getElementById('address-number')?.focus();
                    }, 100);
                } else {
                    toast({
                        title: "CEP não encontrado",
                        description: "Verifique o número digitado.",
                        variant: "destructive"
                    });
                }
            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
            } finally {
                setIsSearchingCep(false);
            }
        }
    };

    const manualStreetSearch = () => {
        // Se já temos Cidade e UF, usamos o ViaCEP (mais preciso para o Brasil)
        if (editFormData.city && editFormData.state && editFormData.street.length >= 3) {
            searchAddressByStreet();
        } else {
            // Caso contrário, usamos a busca global do Nominatim
            searchAddressGlobally(streetSearchTerm);
        }
    };

    const searchAddressByStreet = async () => {
        if (!editFormData.street || editFormData.street.length < 3 || !editFormData.city || !editFormData.state) {
            toast({
                title: "Dados insuficientes",
                description: "Preencha UF, Cidade e pelo menos 3 letras da rua.",
                variant: "destructive"
            });
            return;
        }

        try {
            setIsSearchingStreet(true);
            const response = await fetch(`https://viacep.com.br/ws/${editFormData.state}/${editFormData.city}/${editFormData.street}/json/`);
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                setStreetSuggestions(data);
            } else {
                toast({
                    title: "Sugestões não encontradas",
                    description: "Tente um nome de rua diferente.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Erro ao buscar por rua:", error);
        } finally {
            setIsSearchingStreet(false);
        }
    };

    const applyStreetSuggestion = (suggestion: any) => {
        const addr = suggestion.address;
        const stateName = addr.state || '';
        const uf = UF_MAP[stateName] || stateName;

        setEditFormData(prev => ({
            ...prev,
            cep: (addr.postcode || '').replace(/\D/g, ''),
            street: addr.road || addr.pedestrian || addr.suburb || suggestion.display_name.split(',')[0],
            neighborhood: addr.suburb || addr.neighbourhood || addr.city_district || '',
            city: addr.city || addr.town || addr.village || addr.municipality || '',
            state: uf.substring(0, 2).toUpperCase()
        }));
        setStreetSuggestions([]);
        setStreetSearchTerm(addr.road || addr.pedestrian || suggestion.display_name.split(',')[0]);

        setTimeout(() => {
            document.getElementById('address-number')?.focus();
        }, 100);
    };

    const openEditModal = (tenant: SaaSTenant) => {
        setModalMode('edit');
        setSelectedTenant(tenant);
        setEditFormData({
            name: tenant.name,
            document: tenant.document || '',
            cnpj: tenant.cnpj || '',
            address: tenant.address || '',
            cep: tenant.cep || '',
            street: tenant.street || '',
            number: tenant.number || '',
            complement: tenant.complement || '',
            neighborhood: tenant.neighborhood || '',
            city: tenant.city || '',
            state: tenant.state || '',
            plan_id: tenant.plan_id || '',
            account_type: tenant.account_type || 'AGENCY',
            email: tenant.email || '',
            phone: tenant.phone || '',
            max_users: tenant.max_users,
            max_storage_gb: tenant.max_storage_gb || 10,
            whatsapp_limit: tenant.whatsapp_limit || 0,
            contact_name: (tenant as any).contact_name || '',
            contact_phone: (tenant as any).contact_phone || ''
        });
        setStreetSearchTerm(tenant.street || '');
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setActionLoading(modalMode === 'edit' ? selectedTenant?.id || 'loading' : 'loading');

            // Normalizar dados para evitar 422 (UUID vazio)
            const submitData = {
                ...editFormData,
                plan_id: editFormData.plan_id === '' ? null : editFormData.plan_id
            };

            if (modalMode === 'create') {
                await createAdminTenant(submitData);
                toast({
                    title: "Cliente Cadastrado",
                    description: "O novo cliente foi adicionado com sucesso.",
                });
            } else {
                if (!selectedTenant) return;
                await updateAdminTenant(selectedTenant.id, submitData);
                toast({
                    title: "Cadastro Atualizado",
                    description: "Os dados do cliente foram salvos com sucesso.",
                });
            }

            setIsEditModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error("[TenantsPage] Erro na submissão:", error);

            // Formatador amigável para erro 422 (Pydantic)
            const detail = error.response?.data?.detail;
            let errorMessage = "Ocorreu um erro ao tentar processar a solicitação.";

            if (Array.isArray(detail)) {
                errorMessage = detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(' | ');
            } else if (typeof detail === 'string') {
                errorMessage = detail;
            }

            toast({
                title: modalMode === 'create' ? "Erro ao cadastrar" : "Erro ao atualizar",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <ShieldCheck className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Gestão de <span className="text-primary">Clientes</span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-2">
                        Controle central de instâncias e faturamento — Manager Show
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group hidden md:block">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={18} />
                        <Input
                            placeholder="Buscar cliente..."
                            className="pl-12 w-[320px] h-11 rounded-lg border-border bg-background shadow-sm focus:ring-primary/20"
                        />
                    </div>
                    <Button
                        onClick={openCreateModal}
                        className="rounded-lg bg-primary text-primary-foreground border-0 h-11 px-6 font-semibold shadow-sm hover:bg-primary/90 transition-all"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Novo Cliente
                    </Button>
                </div>
            </div>

            <Card className="rounded-2xl border border-border shadow-sm overflow-hidden bg-card">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="border-b border-border/50">
                            <TableHead className="w-[70px] text-center"></TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-4">Cliente / Identificador</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plano / Limites</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status SaaS</TableHead>
                            <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cadastro</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((t) => (
                            <TableRow key={t.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors group">
                                <TableCell className="py-4 flex justify-center">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all relative">
                                        <Building2 size={22} />
                                        <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground leading-none">{t.name}</p>
                                    </div>
                                    <p className="text-xs font-semibold text-muted-foreground mt-1.5">{t.cnpj || t.document}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className={cn(
                                                "text-[10px] font-black uppercase tracking-tighter h-5",
                                                t.account_type === 'ARTIST' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                            )}>
                                                {t.account_type === 'ARTIST' ? 'ARTISTA' : 'AGÊNCIA'}
                                            </Badge>
                                            <Badge variant="secondary" className="w-fit text-xs font-semibold h-5">
                                                {t.plan_type || t.plan || 'Plano Personalizado'}
                                            </Badge>
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground tracking-tight">
                                            {t.max_users} usuários • {t.max_storage_gb || 10}GB • {t.whatsapp_limit || 0} Whats
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {t.status === 'ACTIVE' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                <ShieldCheck size={14} />
                                                <span className="text-xs font-bold">Ativo</span>
                                            </div>
                                        )}
                                        {t.status === 'SUSPENDED' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                                <ShieldAlert size={14} />
                                                <span className="text-xs font-bold">Suspenso</span>
                                            </div>
                                        )}
                                        {t.status === 'TRIAL' && (
                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                                <Activity size={14} />
                                                <span className="text-xs font-bold uppercase">Teste</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-lg hover:bg-muted transition-colors">
                                                <MoreVertical size={18} className="text-muted-foreground" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-xl border-border bg-popover shadow-xl p-1.5 min-w-[200px]">
                                            <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-3 py-2">Gestão</DropdownMenuLabel>
                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem
                                                onClick={() => router.push(`/admin/tenants/${t.id}`)}
                                                className="rounded-lg px-3 py-2.5 cursor-pointer group hover:bg-muted transition-colors"
                                            >
                                                <ExternalLink className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-foreground">Painel de Gestão</span>
                                                    <span className="text-xs text-muted-foreground">Dados, Plano e Faturamento</span>
                                                </div>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => handleSimulateAccess(t)}
                                                disabled={actionLoading === t.id}
                                                className="rounded-lg px-3 py-2.5 cursor-pointer group hover:bg-primary/10 transition-colors"
                                            >
                                                <Users className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                <span className="text-sm font-semibold">
                                                    {actionLoading === t.id ? 'Autorizando...' : 'Simular Acesso'}
                                                </span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => handleToggleStatus(t)}
                                                disabled={actionLoading === t.id}
                                                className="rounded-lg px-3 py-2.5 cursor-pointer group text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                                            >
                                                {actionLoading === t.id ? (
                                                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Ban className="mr-3 h-4 w-4" />
                                                )}
                                                <span className="text-sm font-semibold">{t.status === 'ACTIVE' ? 'Suspender Acesso' : 'Ativar Acesso'}</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Modal de Edição */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl rounded-2xl border-border bg-card p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="p-6 border-b border-border">
                        <DialogTitle className="text-xl font-extrabold text-foreground">
                            {modalMode === 'create' ? 'Novo' : 'Editar'} <span className="text-primary">Cliente</span>
                        </DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground mt-1">
                            {modalMode === 'create' ? 'Cadastrar nova produtora ou escritório' : `Gestão do Cliente — ${selectedTenant?.name}`}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit}>
                        <Tabs defaultValue="geral" className="w-full">
                            <TabsList className="w-full justify-start rounded-none bg-muted/30 p-2 h-14 border-b border-border flex gap-2">
                                <TabsTrigger value="geral" className="rounded-lg px-4 font-semibold text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
                                    <Building2 className="mr-2 h-4 w-4" /> Geral
                                </TabsTrigger>
                                <TabsTrigger value="endereco" className="rounded-lg px-4 font-semibold text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
                                    <MapPin className="mr-2 h-4 w-4" /> Endereço
                                </TabsTrigger>
                                <TabsTrigger value="assinatura" className="rounded-lg px-4 font-semibold text-sm data-[state=active]:bg-card data-[state=active]:shadow-sm">
                                    <CreditCard className="mr-2 h-4 w-4" /> Plano
                                </TabsTrigger>
                            </TabsList>

                            <div className="p-6 space-y-6">
                                <TabsContent value="geral" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Comercial</Label>
                                            <Input
                                                value={editFormData.name}
                                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                className="rounded-lg border-border bg-background h-11"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CNPJ Oficial</Label>
                                            <Input
                                                value={editFormData.cnpj}
                                                onChange={(e) => setEditFormData({ ...editFormData, cnpj: e.target.value })}
                                                className="rounded-lg border-border bg-background h-11"
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de Conta</Label>
                                            <Select
                                                value={editFormData.account_type}
                                                onValueChange={(v: any) => setEditFormData({ ...editFormData, account_type: v })}
                                            >
                                                <SelectTrigger className="rounded-lg border-border bg-background h-11">
                                                    <SelectValue placeholder="Selecione o perfil" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ARTIST">ARTISTA (Individual/Banda)</SelectItem>
                                                    <SelectItem value="AGENCY">AGÊNCIA (Produtora/Escritório)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">E-mail Administrativo</Label>
                                            <Input
                                                type="email"
                                                value={editFormData.email}
                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                                className="rounded-lg border-border bg-background h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone Principal</Label>
                                            <Input
                                                value={editFormData.phone}
                                                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                                                className="rounded-lg border-border bg-background h-11"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="endereco" className="mt-0 space-y-6">
                                    <div className="grid grid-cols-6 gap-4">
                                        {/* Row 1: Logradouro e CEP */}
                                        <div className="col-span-4 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                                Logradouro (Rua/Av)
                                                {isSearchingStreet && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                            </Label>
                                            <div className="relative flex gap-2">
                                                <div className="relative flex-1">
                                                    <Input
                                                        value={streetSearchTerm}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setStreetSearchTerm(val);
                                                            setEditFormData(prev => ({ ...prev, street: val }));
                                                        }}
                                                        placeholder="Digite o nome da rua..."
                                                        className="rounded-lg border-border bg-background h-11 pr-10"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={manualStreetSearch}
                                                        title="Buscar endereço pelo nome da rua"
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Search size={18} />
                                                    </button>
                                                </div>
                                                {streetSuggestions.length > 0 && (
                                                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-[300px] overflow-y-auto p-2">
                                                        <div className="flex items-center justify-between p-2 sticky top-0 bg-card border-b border-border mb-1">
                                                            <span className="text-xs font-bold text-muted-foreground">Sugestões (Nominatim/OSM)</span>
                                                            <button type="button" onClick={() => setStreetSuggestions([])} className="hover:text-primary transition-colors"><X size={14} /></button>
                                                        </div>
                                                        {streetSuggestions.map((s, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => applyStreetSuggestion(s)}
                                                                className="p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors border-b border-border/30 last:border-0"
                                                            >
                                                                <p className="text-xs font-bold text-foreground leading-tight">
                                                                    {s.address.road || s.address.pedestrian || s.display_name.split(',')[0]}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {(s.address.suburb || s.address.neighbourhood) ? `${s.address.suburb || s.address.neighbourhood}, ` : ''}
                                                                    {s.address.city || s.address.town || ''} - {s.address.state || ''}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                                                CEP
                                                {isSearchingCep && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    value={editFormData.cep}
                                                    onChange={(e) => handleCepChange(e.target.value)}
                                                    placeholder="00000-000"
                                                    className="rounded-lg border-border bg-background h-11 font-medium tabular-nums pr-10"
                                                    maxLength={9}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={manualCepSearch}
                                                    title="Buscar endereço pelo CEP"
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
                                                placeholder="UF"
                                                maxLength={2}
                                                className="rounded-lg border-border bg-background h-11 font-semibold text-center uppercase"
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cidade</Label>
                                            <Input
                                                value={editFormData.city}
                                                onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                                                placeholder="Cidade"
                                                className="rounded-lg border-border bg-background h-11"
                                            />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Número</Label>
                                            <Input
                                                id="address-number"
                                                value={editFormData.number}
                                                onChange={(e) => setEditFormData({ ...editFormData, number: e.target.value })}
                                                placeholder="S/N"
                                                className="rounded-lg border-border bg-background h-11 font-medium tabular-nums"
                                            />
                                        </div>

                                        {/* Row 3: Bairro e Complemento */}
                                        <div className="col-span-3 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bairro</Label>
                                            <Input
                                                value={editFormData.neighborhood}
                                                onChange={(e) => setEditFormData({ ...editFormData, neighborhood: e.target.value })}
                                                placeholder="Bairro"
                                                className="rounded-lg border-border bg-background h-11"
                                            />
                                        </div>
                                        <div className="col-span-3 space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Complemento</Label>
                                            <Input
                                                value={editFormData.complement}
                                                onChange={(e) => setEditFormData({ ...editFormData, complement: e.target.value })}
                                                placeholder="Apto, Bloco, etc."
                                                className="rounded-lg border-border bg-background h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Responsável (Contato)</Label>
                                                <Input
                                                    value={editFormData.contact_name}
                                                    onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                                                    className="rounded-lg border-border bg-background h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fone Responsável</Label>
                                                <Input
                                                    value={editFormData.contact_phone}
                                                    onChange={(e) => setEditFormData({ ...editFormData, contact_phone: e.target.value })}
                                                    className="rounded-lg border-border bg-background h-11"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="assinatura" className="mt-0 space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plano Base</Label>
                                            <Select
                                                value={editFormData.plan_id}
                                                onValueChange={(v) => {
                                                    const bundle = plans.find(p => p.id === v);
                                                    setEditFormData({
                                                        ...editFormData,
                                                        plan_id: v,
                                                        max_users: bundle?.add_users || 5,
                                                        max_storage_gb: bundle?.add_storage_gb || 10,
                                                        whatsapp_limit: bundle?.add_whatsapp || 0
                                                    });
                                                }}
                                            >
                                                <SelectTrigger className="rounded-lg border-border bg-background h-11">
                                                    <SelectValue placeholder="Selecione um plano" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {plans.map(p => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name} - R$ {p.price?.toFixed(2)}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuários</Label>
                                                <Input
                                                    type="number"
                                                    value={editFormData.max_users}
                                                    onChange={(e) => setEditFormData({ ...editFormData, max_users: parseInt(e.target.value) })}
                                                    className="rounded-lg border-border bg-background h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Armazenamento (GB)</Label>
                                                <Input
                                                    type="number"
                                                    value={editFormData.max_storage_gb}
                                                    onChange={(e) => setEditFormData({ ...editFormData, max_storage_gb: parseInt(e.target.value) })}
                                                    className="rounded-lg border-border bg-background h-11"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">WhatsApp</Label>
                                                <Input
                                                    type="number"
                                                    value={editFormData.whatsapp_limit}
                                                    onChange={(e) => setEditFormData({ ...editFormData, whatsapp_limit: parseInt(e.target.value) })}
                                                    className="rounded-lg border-border bg-background h-11"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                                        <p className="text-xs font-bold text-foreground mb-3">Módulos Ativos do Sistema:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {['CRM', 'FINANCEIRO', 'ARTISTAS', 'SHOWS', 'WIZARD'].map(mod => (
                                                <Badge key={mod} variant="secondary" className="px-3 py-1 font-semibold">
                                                    {mod}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>

                        <DialogFooter className="p-6 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-lg h-11 px-6 font-semibold"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={actionLoading !== null}
                                className="rounded-lg bg-primary h-11 px-8 font-semibold shadow-md"
                            >
                                {actionLoading !== null ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> {modalMode === 'create' ? 'Cadastrar Cliente' : 'Salvar Alterações'}</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
