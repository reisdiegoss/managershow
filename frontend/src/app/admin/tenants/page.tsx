'use client';

import React, { useState } from 'react';
import {
    Building2,
    MoreVertical,
    Plus,
    Search,
    ShieldAlert,
    ShieldCheck,
    UserPlus,
    CreditCard,
    Ban,
    ExternalLink,
    Filter,
    Users
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
import { useApi } from '@/lib/api';
import { SaaSTenant } from '@/types/admin';
import { Activity, Loader2, Save } from 'lucide-react';
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

export default function TenantsAdminPage() {
    const { getAdminTenants, updateAdminTenant } = useApi();
    const { toast } = useToast();
    const [tenants, setTenants] = useState<SaaSTenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Estados do Modal de Edição
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState<SaaSTenant | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        document: '',
        max_users: 5
    });

    React.useEffect(() => {
        loadTenants();
    }, []);

    const loadTenants = async () => {
        try {
            setLoading(true);
            const response = await getAdminTenants();
            if (response.data && response.data.items) {
                setTenants(response.data.items);
            } else {
                setTenants([]);
            }
        } catch (error) {
            console.error("[TenantsPage] Erro ao carregar tenants:", error);
            setTenants([]);
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

            loadTenants();
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

    const handleSimulateAccess = (tenant: SaaSTenant) => {
        toast({
            title: "Simulação Iniciada",
            description: `Você está simulando o acesso para ${tenant.name}. Redirecionando...`,
        });
        // Lógica de redirecionamento ou impersonate aqui futuramente
    };

    const openEditModal = (tenant: SaaSTenant) => {
        setSelectedTenant(tenant);
        setEditFormData({
            name: tenant.name,
            document: tenant.document || '',
            max_users: tenant.max_users
        });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTenant) return;

        try {
            setActionLoading(selectedTenant.id);
            await updateAdminTenant(selectedTenant.id, editFormData);

            toast({
                title: "Cadastro Atualizado",
                description: "Os dados do cliente foram salvos com sucesso.",
            });

            setIsEditModalOpen(false);
            loadTenants();
        } catch (error) {
            toast({
                title: "Erro ao atualizar",
                description: "Ocorreu um erro ao tentar salvar as alterações.",
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
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                        Gestão de <span className="text-primary">Clientes</span>
                    </h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Ecossistema de Clientes do Manager Show
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={16} />
                        <Input
                            placeholder="Buscar cliente por nome ou CNPJ..."
                            className="pl-12 w-[300px] h-12 rounded-2xl border-border bg-card shadow-sm focus:ring-primary"
                        />
                    </div>
                    <Button className="rounded-2xl bg-foreground text-background border-0 h-12 px-6 font-bold uppercase italic shadow-lg hover:bg-primary hover:text-primary-foreground transition-all">
                        <Plus className="mr-2 h-5 w-5" /> Novo Cliente
                    </Button>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border-border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-0">
                            <TableHead className="w-[80px] text-center"></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-6">Cliente / Identificador</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plano / Limites</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status SaaS</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cadastro</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((t) => (
                            <TableRow key={t.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                                <TableCell className="py-6 flex justify-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                                        <Building2 size={24} />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-black text-foreground italic uppercase leading-none mb-1">{t.name}</p>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.document}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <Badge variant="outline" className="w-fit bg-muted text-[10px] font-black border-border uppercase italic">
                                            {t.plan}
                                        </Badge>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tight">{t.max_users} usuários permitidos</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {t.status === 'ACTIVE' && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                                <ShieldCheck size={12} />
                                                <span className="text-[10px] font-black uppercase italic">Ativo</span>
                                            </div>
                                        )}
                                        {t.status === 'SUSPENDED' && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                                <ShieldAlert size={12} />
                                                <span className="text-[10px] font-black uppercase italic">Suspenso</span>
                                            </div>
                                        )}
                                        {t.status === 'TRIAL' && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                                <Activity size={12} />
                                                <span className="text-[10px] font-black uppercase italic">Trial</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[11px] font-black italic text-muted-foreground uppercase">
                                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors">
                                                <MoreVertical size={20} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-border bg-popover shadow-xl p-2 min-w-[220px]">
                                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground px-4 py-2">Gerenciar Cliente</DropdownMenuLabel>

                                            <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer group hover:bg-primary/10 transition-colors">
                                                <CreditCard className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                <span className="text-xs font-bold uppercase italic">Gerenciar Plano</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => handleSimulateAccess(t)}
                                                className="rounded-xl px-4 py-3 cursor-pointer group hover:bg-primary/10 transition-colors"
                                            >
                                                <Users className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                <span className="text-xs font-bold uppercase italic">Simular Acesso</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator className="bg-border my-2" />

                                            <DropdownMenuItem
                                                onClick={() => openEditModal(t)}
                                                className="rounded-xl px-4 py-3 cursor-pointer group hover:bg-primary/10 transition-colors"
                                            >
                                                <ExternalLink className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                <span className="text-xs font-bold uppercase italic">Editar Cadastro</span>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem
                                                onClick={() => handleToggleStatus(t)}
                                                disabled={actionLoading === t.id}
                                                className="rounded-xl px-4 py-3 cursor-pointer group text-rose-500 focus:text-rose-500 focus:bg-rose-500/10"
                                            >
                                                {actionLoading === t.id ? (
                                                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Ban className="mr-3 h-4 w-4" />
                                                )}
                                                <span className="text-xs font-bold uppercase italic">{t.status === 'ACTIVE' ? 'Suspender Acesso' : 'Ativar Acesso'}</span>
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
                <DialogContent className="max-w-md rounded-[2.5rem] border-border bg-card backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase italic tracking-tighter text-foreground">
                            Editar <span className="text-primary">Cliente</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Atualize os dados básicos da conta
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase text-muted-foreground ml-2">Nome do Cliente</Label>
                            <Input
                                id="name"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                className="rounded-2xl border-border bg-background focus:ring-primary h-12"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="document" className="text-[10px] font-black uppercase text-muted-foreground ml-2">CNPJ / Identificador</Label>
                            <Input
                                id="document"
                                value={editFormData.document}
                                onChange={(e) => setEditFormData({ ...editFormData, document: e.target.value })}
                                className="rounded-2xl border-border bg-background focus:ring-primary h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="max_users" className="text-[10px] font-black uppercase text-muted-foreground ml-2">Limite de Usuários</Label>
                            <Input
                                id="max_users"
                                type="number"
                                value={editFormData.max_users}
                                onChange={(e) => setEditFormData({ ...editFormData, max_users: parseInt(e.target.value) })}
                                className="rounded-2xl border-border bg-background focus:ring-primary h-12"
                                required
                            />
                        </div>

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-2xl h-12 px-6 font-black uppercase italic border-border"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={actionLoading !== null}
                                className="rounded-2xl bg-primary h-12 px-8 font-black uppercase italic shadow-lg shadow-primary/20"
                            >
                                {actionLoading !== null ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="mr-2 h-5 w-5" /> Salvar Alterações</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
