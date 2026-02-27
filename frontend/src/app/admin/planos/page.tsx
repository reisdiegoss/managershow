'use client';

import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    CreditCard,
    CheckCircle2,
    XCircle,
    Edit2,
    Trash2,
    Layers,
    Users,
    Package,
    Settings,
    MessageSquare,
    LayoutGrid,
    PieChart
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
import { useApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface SaaSPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    max_users: number;
    is_active: boolean;
    features: string[];
}

const FEATURE_LABELS: Record<string, { label: string, icon: any }> = {
    'whatsapp': { label: 'WhatsApp', icon: MessageSquare },
    'kanban': { label: 'Kanban', icon: LayoutGrid },
    'reports': { label: 'Relatórios', icon: PieChart },
    'users_pro': { label: 'Multi-Usuários', icon: Users },
};

export default function PlansAdminPage() {
    const { api } = useApi();
    const { toast } = useToast();
    const [plans, setPlans] = useState<SaaSPlan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/retaguarda/plans');
            if (response.data && response.data.items) {
                setPlans(response.data.items);
            }
        } catch (error) {
            console.error("Erro ao carregar planos:", error);
            toast({
                title: "Erro ao carregar",
                description: "Não foi possível buscar a lista de planos.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Layers className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                        Planos e <span className="text-primary">Ofertas</span>
                    </h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                        Configuração de Pacotes SaaS e Módulos
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button className="rounded-2xl bg-foreground text-background border-0 h-12 px-6 font-bold uppercase italic shadow-lg hover:bg-primary hover:text-primary-foreground transition-all">
                        <Plus className="mr-2 h-5 w-5" /> Criar Novo Plano
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="rounded-[2.5rem] border-border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm p-8 hover:shadow-xl transition-all group relative">
                        {!plan.is_active && (
                            <div className="absolute top-6 right-6">
                                <Badge variant="destructive" className="rounded-full uppercase text-[9px] font-black">Inativo</Badge>
                            </div>
                        )}

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Package size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground italic uppercase">
                                    {plan.name}
                                </h3>
                                <p className="text-2xl font-black text-primary">
                                    R$ {plan.price.toFixed(2)}
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase ml-1">/mês</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                {plan.description || "Sem descrição definida."}
                            </p>

                            <div className="flex items-center gap-2 text-[11px] font-black text-foreground uppercase italic">
                                <Users size={14} className="text-muted-foreground" />
                                Até {plan.max_users} usuários inclusos
                            </div>
                        </div>

                        <div className="space-y-2 mb-8 border-t border-border/50 pt-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Recursos Habilitados</p>
                            <div className="flex flex-wrap gap-2">
                                {plan.features.map(feat => {
                                    const meta = FEATURE_LABELS[feat] || { label: feat, icon: Settings };
                                    return (
                                        <Badge key={feat} variant="outline" className="rounded-xl px-3 py-1 bg-muted border-border text-muted-foreground text-[9px] font-black uppercase flex items-center gap-1.5 group-hover:bg-primary/10 group-hover:border-primary/20 group-hover:text-primary transition-colors">
                                            <meta.icon size={10} />
                                            {meta.label}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="flex-1 rounded-2xl h-11 text-xs font-black uppercase italic border-border hover:bg-accent hover:text-accent-foreground">
                                <Edit2 size={14} className="mr-2" /> Editar
                            </Button>
                            <Button variant="outline" className="rounded-2xl h-11 w-11 p-0 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all text-muted-foreground">
                                <Trash2 size={14} />
                            </Button>
                        </div>
                    </Card>
                ))}

                {/* Card de Teste (Placeholder se vazio) */}
                {plans.length === 0 && (
                    <Card className="rounded-[2.5rem] border-dashed border-2 border-border shadow-none bg-muted/20 p-8 flex flex-col items-center justify-center text-center opacity-60">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-4">
                            <Layers size={32} />
                        </div>
                        <h3 className="font-black text-muted-foreground italic uppercase">Nenhum plano cadastrado</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                            Comece criando seu primeiro pacote de oferta
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
}
