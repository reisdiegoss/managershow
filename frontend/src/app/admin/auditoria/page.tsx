'use client';

import React, { useState, useEffect } from 'react';
import {
    Activity,
    Search,
    ShieldCheck,
    History,
    AlertCircle,
    User,
    Target,
    Clock,
    Filter,
    ArrowUpRight,
    SearchCode,
    Terminal
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
import { useAdminApi } from '@/lib/api/useAdminApi';
import { useToast } from '@/components/ui/use-toast';

interface AuditLog {
    id: string;
    admin_id: string;
    action: string;
    target_id: string | null;
    details: any;
    created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
    'CREATE': 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    'UPDATE': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    'DELETE': 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    'SUSPEND': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    'IMPERSONATE': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
};

export default function AuditAdminPage() {
    const { getAdminAuditLogs } = useAdminApi();
    const { toast } = useToast();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const response = await getAdminAuditLogs();
            if (response.data && response.data.items) {
                setLogs(response.data.items);
            }
        } catch (error) {
            console.error("Erro ao carregar auditoria:", error);
            toast({
                title: "Erro na Auditoria",
                description: "Não foi possível carregar os logs do sistema.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <History className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header Ultra */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Terminal className="text-primary h-7 w-7" />
                        Auditoria de <span className="text-primary">Logs</span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        Transparência Total e Rastreabilidade do Ecossistema
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-hover:text-primary transition-colors" size={16} />
                        <Input
                            placeholder="Pesquisar ação ou admin..."
                            className="pl-12 w-[300px] h-11 rounded-xl border-border bg-card shadow-sm focus:ring-primary text-sm font-medium"
                        />
                    </div>
                    <Button variant="outline" className="rounded-xl border-border h-11 px-5 font-semibold shadow-sm hover:bg-primary/5 transition-all">
                        <Filter className="mr-2 h-4 w-4 text-primary" /> Filtrar
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats Auditoria */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Ações Totais', value: logs.length, icon: Activity, color: 'text-primary' },
                    { label: 'Segurança', value: '100%', icon: ShieldCheck, color: 'text-emerald-500' },
                    { label: 'Alertas', value: 0, icon: AlertCircle, color: 'text-amber-500' },
                    { label: 'Período', value: '7 Dias', icon: Clock, color: 'text-blue-500' },
                ].map((stat, i) => (
                    <Card key={i} className="p-6 rounded-3xl border-border bg-card/50 backdrop-blur-sm flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                            <h4 className="text-xl font-bold text-foreground">{stat.value}</h4>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="rounded-3xl border-border shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-0">
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-5">Timestamp / Data</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin / Agente</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ação Executada</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alvo / Referência</TableHead>
                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Detalhes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                                <TableCell className="py-5 font-semibold text-muted-foreground text-sm tabular-nums">
                                    {new Date(log.created_at).toLocaleString('pt-BR')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-primary">
                                            <User size={14} />
                                        </div>
                                        <span className="text-xs font-semibold uppercase text-foreground">{log.admin_id.split('_').pop()}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`rounded-md px-3 py-1 text-xs font-semibold uppercase ${ACTION_COLORS[log.action] || 'text-muted-foreground bg-muted/20'}`}>
                                        {log.action}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    {log.target_id ? (
                                        <div className="flex items-center gap-2">
                                            <Target size={12} className="text-muted-foreground" />
                                            <span className="text-xs font-medium text-foreground font-mono">{log.target_id}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Global</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="group-hover:text-primary transition-colors">
                                        <SearchCode size={18} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}

                        {logs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center opacity-50">
                                        <History size={48} className="mb-4 text-muted-foreground" />
                                        <p className="text-sm font-semibold text-muted-foreground">Nenhum evento registrado</p>
                                        <p className="text-xs font-medium mt-1">O sistema está limpo e operacional</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" className="rounded-lg h-9 px-4 text-xs font-semibold border-border disabled:opacity-30">Anterior</Button>
                <div className="flex items-center gap-1.5 px-4 h-9 rounded-lg bg-muted/50 border border-border text-xs font-medium">
                    Página <span className="text-primary font-bold">1</span> de 1
                </div>
                <Button variant="outline" className="rounded-lg h-9 px-4 text-xs font-semibold border-border disabled:opacity-30">Próximo</Button>
            </div>
        </div>
    );
}
