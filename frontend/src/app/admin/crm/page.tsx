'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    MessageCircle,
    Mail,
    Phone,
    Calendar,
    ArrowRight,
    Loader2,
    Building2,
    CheckCircle2,
    MoreVertical
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAdminApi } from '@/lib/api/useAdminApi';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface Lead {
    id: string;
    name: string;
    agency_name: string;
    status: 'NOVO' | 'CONTATADO' | 'QUALIFICADO' | 'PROPOSTA' | 'CONVERTIDO' | 'PERDIDO';
    email?: string;
    phone?: string;
    created_at: string;
}

const columns = [
    { id: 'NOVO', label: 'Leads Novos', color: 'bg-blue-500' },
    { id: 'CONTATADO', label: 'Em Contato', color: 'bg-amber-500' },
    { id: 'QUALIFICADO', label: 'Qualificados', color: 'bg-indigo-500' },
    { id: 'PROPOSTA', label: 'Proposta Enviada', color: 'bg-primary' },
    { id: 'CONVERTIDO', label: 'Novos Clientes', color: 'bg-emerald-500' },
];

export default function CRMPage() {
    const { getAdminLeads } = useAdminApi();
    const { toast } = useToast();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const response = await getAdminLeads();
            setLeads(response.data.items || []);
        } catch (error) {
            console.error("Erro ao carregar leads:", error);
            // Fallback para demonstração se a API falhar (desenvolvimento)
            setLeads([
                { id: '1', name: 'Diego Reis', agency_name: 'Vima Sistemas', status: 'PROPOSTA', created_at: new Date().toISOString() },
                { id: '2', name: 'João Silva', agency_name: 'Showtime Produtora', status: 'NOVO', created_at: new Date().toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        CRM de <span className="text-primary tracking-tight">Vendas</span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        Funil de Aquisição de Clientes SaaS
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input
                            placeholder="Buscar leads..."
                            className="pl-12 w-[250px] h-11 rounded-xl border-border bg-card shadow-sm font-medium text-sm"
                        />
                    </div>
                    <Button className="rounded-xl bg-primary h-11 px-5 font-semibold shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Adicionar Lead
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar -mx-10 px-10">
                {columns.map((col) => (
                    <div key={col.id} className="flex-shrink-0 w-80">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2 w-2 rounded-full", col.color)} />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{col.label}</h3>
                            </div>
                            <Badge variant="outline" className="rounded-md h-6 px-2 text-xs font-semibold bg-muted/30 border-border text-muted-foreground">{leads.filter(l => l.status === col.id).length}</Badge>
                        </div>

                        <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-muted/20 border border-border/30 backdrop-blur-sm">
                            {leads.filter(l => l.status === col.id).map((lead) => (
                                <Card key={lead.id} className="p-5 rounded-2xl border-border bg-card hover:border-primary/50 transition-all cursor-grab active:cursor-grabbing shadow-sm group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                            <Building2 size={20} />
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground">
                                            <MoreVertical size={16} />
                                        </Button>
                                    </div>

                                    <h4 className="text-sm font-semibold text-foreground mb-1 line-clamp-1">{lead.agency_name}</h4>
                                    <p className="text-xs font-medium text-muted-foreground mb-4">{lead.name}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                        <div className="flex -space-x-2">
                                            <div className="h-6 w-6 rounded-full bg-blue-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white shadow-sm">DR</div>
                                            <div className="h-6 w-6 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white shadow-sm">+</div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            <Calendar size={12} className="opacity-70" />
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {leads.filter(l => l.status === col.id).length === 0 && (
                                <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl opacity-40">
                                    <Plus size={20} className="mb-2 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-muted-foreground">Vazio</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
