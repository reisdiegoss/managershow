'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    CreditCard,
    Edit2,
    Trash2,
    Layers,
    Users,
    Package,
    Settings,
    MessageSquare,
    LayoutGrid,
    PieChart,
    ChevronRight,
    Sparkles,
    ShieldCheck,
    Loader2,
    Save,
    HardDrive,
    Zap,
    Briefcase
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminApi } from '@/lib/api/useAdminApi';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { cn } from '@/lib/utils';

interface SaaSCatalogBundle {
    id: string;
    name: string;
    price: number;
    add_users: number;
    add_storage_gb: number;
    add_whatsapp: number;
    created_at: string;
}

interface SaaSCatalogAddon {
    id: string;
    name: string;
    price: number;
    addon_type: 'STORAGE' | 'USERS' | 'WHATSAPP';
    quantity_added: number;
    created_at: string;
}

export default function PlansAdminPage() {
    const {
        getAdminBundles, createAdminBundle, updateAdminBundle, deleteAdminBundle,
        getAdminAddons, createAdminAddon, updateAdminAddon, deleteAdminAddon
    } = useAdminApi();
    const { toast } = useToast();

    const [bundles, setBundles] = useState<SaaSCatalogBundle[]>([]);
    const [addons, setAddons] = useState<SaaSCatalogAddon[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Estados dos Modais
    const [bundleModal, setBundleModal] = useState({ open: false, mode: 'create' as 'create' | 'edit', data: null as SaaSCatalogBundle | null });
    const [addonModal, setAddonModal] = useState({ open: false, mode: 'create' as 'create' | 'edit', data: null as SaaSCatalogAddon | null });

    const [bundleForm, setBundleForm] = useState({
        name: '',
        price: 0,
        add_users: 5,
        add_storage_gb: 10,
        add_whatsapp: 0
    });

    const [addonForm, setAddonForm] = useState({
        name: '',
        price: 0,
        addon_type: 'STORAGE' as 'STORAGE' | 'USERS' | 'WHATSAPP',
        quantity_added: 1
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [bRes, aRes] = await Promise.all([getAdminBundles(), getAdminAddons()]);
            setBundles(bRes.data.items || []);
            setAddons(aRes.data.items || []);
        } catch (error) {
            console.error("Erro ao carregar catálogo:", error);
            toast({ title: "Erro ao carregar", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // --- Handlers Bundle ---
    const openBundleModal = (bundle?: SaaSCatalogBundle) => {
        if (bundle) {
            setBundleModal({ open: true, mode: 'edit', data: bundle });
            setBundleForm({
                name: bundle.name,
                price: bundle.price,
                add_users: bundle.add_users,
                add_storage_gb: bundle.add_storage_gb,
                add_whatsapp: bundle.add_whatsapp
            });
        } else {
            setBundleModal({ open: true, mode: 'create', data: null });
            setBundleForm({ name: '', price: 0, add_users: 5, add_storage_gb: 10, add_whatsapp: 0 });
        }
    };

    const handleBundleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('bundle');
            if (bundleModal.mode === 'create') {
                await createAdminBundle(bundleForm);
                toast({ title: "Bundle Criado" });
            } else {
                await updateAdminBundle(bundleModal.data!.id, bundleForm);
                toast({ title: "Bundle Atualizado" });
            }
            setBundleModal({ ...bundleModal, open: false });
            loadData();
        } catch (error: any) {
            toast({ title: "Erro Bundle", description: error.response?.data?.detail, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteBundle = async (id: string) => {
        if (!confirm("Excluir este plano base?")) return;
        try {
            await deleteAdminBundle(id);
            toast({ title: "Excluído" });
            loadData();
        } catch (error) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        }
    };

    // --- Handlers Addon ---
    const openAddonModal = (addon?: SaaSCatalogAddon) => {
        if (addon) {
            setAddonModal({ open: true, mode: 'edit', data: addon });
            setAddonForm({
                name: addon.name,
                price: addon.price,
                addon_type: addon.addon_type,
                quantity_added: addon.quantity_added
            });
        } else {
            setAddonModal({ open: true, mode: 'create', data: null });
            setAddonForm({ name: '', price: 0, addon_type: 'STORAGE', quantity_added: 1 });
        }
    };

    const handleAddonSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setActionLoading('addon');
            if (addonModal.mode === 'create') {
                await createAdminAddon(addonForm);
                toast({ title: "Addon Criado" });
            } else {
                await updateAdminAddon(addonModal.data!.id, addonForm);
                toast({ title: "Addon Atualizado" });
            }
            setAddonModal({ ...addonModal, open: false });
            loadData();
        } catch (error: any) {
            toast({ title: "Erro Addon", description: error.response?.data?.detail, variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteAddon = async (id: string) => {
        if (!confirm("Excluir este módulo?")) return;
        try {
            await deleteAdminAddon(id);
            toast({ title: "Excluído" });
            loadData();
        } catch (error) {
            toast({ title: "Erro ao excluir", variant: "destructive" });
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        Catálogo de <span className="text-primary">SaaS</span>
                        <Sparkles className="text-primary h-6 w-6" />
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-2">
                        Gerencie Planos Base e Módulos Avulsos.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="bundles" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
                    <TabsTrigger value="bundles" className="font-bold">Planos Base</TabsTrigger>
                    <TabsTrigger value="addons" className="font-bold">Módulos</TabsTrigger>
                </TabsList>

                <TabsContent value="bundles" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Briefcase className="text-primary" size={20} />
                            Configuração de Planos Parent
                        </h2>
                        <Button onClick={() => openBundleModal()} className="h-10 px-4 font-bold">
                            <Plus className="mr-2 h-4 w-4" /> Novo Plano
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bundles.map(b => (
                            <Card key={b.id} className="p-6 relative overflow-hidden group hover:shadow-md transition-all border-border/50">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Package size={24} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Mensalidade</p>
                                        <h4 className="text-xl font-black text-foreground tabular-nums">
                                            <span className="text-xs font-bold mr-0.5">R$</span>
                                            {b.price.toFixed(2)}
                                        </h4>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-4">{b.name}</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                                        <Users size={16} className="text-blue-500" />
                                        <span>{b.add_users} Usuários</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                                        <HardDrive size={16} className="text-amber-500" />
                                        <span>{b.add_storage_gb} GB Armazenamento</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                                        <MessageSquare size={16} className="text-emerald-500" />
                                        <span>{b.add_whatsapp} Linhas WhatsApp</span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={() => openBundleModal(b)} variant="secondary" size="sm" className="flex-1 font-bold">
                                        <Edit2 size={14} className="mr-2" /> Editar
                                    </Button>
                                    <Button onClick={() => handleDeleteBundle(b.id)} variant="ghost" size="sm" className="w-10 p-0 text-rose-500 hover:bg-rose-500/10">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="addons" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="text-amber-500" size={20} />
                            Módulos Adicionais
                        </h2>
                        <Button onClick={() => openAddonModal()} className="h-10 px-4 font-bold bg-amber-500 hover:bg-amber-600">
                            <Plus className="mr-2 h-4 w-4" /> Novo Módulo
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {addons.map(a => (
                            <Card key={a.id} className="p-6 border-border/50">
                                <div className="flex justify-between items-start mb-6">
                                    <Badge variant="outline" className="bg-muted/50 uppercase tracking-tighter text-[10px] font-black">
                                        {a.addon_type}
                                    </Badge>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Preço Un.</p>
                                        <h4 className="text-xl font-black text-foreground tabular-nums">
                                            R$ {a.price.toFixed(2)}
                                        </h4>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold mb-2">{a.name}</h3>
                                <p className="text-sm text-muted-foreground mb-6 font-medium">
                                    Adiciona +{a.quantity_added} {a.addon_type === 'STORAGE' ? 'GB' : a.addon_type === 'USERS' ? 'Usuários' : 'Instância WA'}
                                </p>
                                <div className="flex gap-2">
                                    <Button onClick={() => openAddonModal(a)} variant="secondary" size="sm" className="flex-1 font-bold">
                                        <Edit2 size={14} className="mr-2" /> Editar
                                    </Button>
                                    <Button onClick={() => handleDeleteAddon(a.id)} variant="ghost" size="sm" className="w-10 p-0 text-rose-500 hover:bg-rose-500/10">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modal Bundle */}
            <Dialog open={bundleModal.open} onOpenChange={o => setBundleModal(p => ({ ...p, open: o }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{bundleModal.mode === 'create' ? 'Novo Plano' : 'Editar Plano'}</DialogTitle>
                        <DialogDescription>Define os recursos base deste plano.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBundleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome do Plano</Label>
                            <Input value={bundleForm.name} onChange={e => setBundleForm({ ...bundleForm, name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Preço Mensal (R$)</Label>
                                <Input type="number" step="0.01" value={bundleForm.price} onChange={e => setBundleForm({ ...bundleForm, price: parseFloat(e.target.value) })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Usuários Inclusos</Label>
                                <Input type="number" value={bundleForm.add_users} onChange={e => setBundleForm({ ...bundleForm, add_users: parseInt(e.target.value) })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Armazenamento (GB)</Label>
                                <Input type="number" value={bundleForm.add_storage_gb} onChange={e => setBundleForm({ ...bundleForm, add_storage_gb: parseInt(e.target.value) })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Linhas WhatsApp</Label>
                                <Input type="number" value={bundleForm.add_whatsapp} onChange={e => setBundleForm({ ...bundleForm, add_whatsapp: parseInt(e.target.value) })} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={actionLoading === 'bundle'} className="w-full font-bold">
                                {actionLoading === 'bundle' ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Salvar Plano</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Addon */}
            <Dialog open={addonModal.open} onOpenChange={o => setAddonModal(p => ({ ...p, open: o }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{addonModal.mode === 'create' ? 'Novo Adicional' : 'Editar Adicional'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddonSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome amigável</Label>
                            <Input value={addonForm.name} onChange={e => setAddonForm({ ...addonForm, name: e.target.value })} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={addonForm.addon_type} onValueChange={(v: any) => setAddonForm({ ...addonForm, addon_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="STORAGE">Armazenamento (GB)</SelectItem>
                                        <SelectItem value="USERS">Usuários</SelectItem>
                                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Preço (R$)</Label>
                                <Input type="number" step="0.01" value={addonForm.price} onChange={e => setAddonForm({ ...addonForm, price: parseFloat(e.target.value) })} required />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label>Quantidade Adicionada (+)</Label>
                                <Input type="number" value={addonForm.quantity_added} onChange={e => setAddonForm({ ...addonForm, quantity_added: parseInt(e.target.value) })} required />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={actionLoading === 'addon'} className="w-full font-bold bg-amber-500 hover:bg-amber-600">
                                {actionLoading === 'addon' ? <Loader2 className="animate-spin" /> : <><Save size={18} className="mr-2" /> Salvar Adicional</>}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
