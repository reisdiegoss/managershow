'use client';

import React, { useState } from 'react';
import {
    LifeBuoy,
    MessageSquare,
    Send,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Building2,
    ListFilter,
    MoreHorizontal,
    Search,
    ShieldCheck,
    UserCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAdminApi } from '@/lib/api/useAdminApi';
import { SaaSTicket } from '@/types/admin';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function TicketsAdminPage() {
    const { getAdminTickets } = useAdminApi();
    const [tickets, setTickets] = useState<SaaSTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<SaaSTicket | null>(null);
    const [reply, setReply] = useState('');

    React.useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const response = await getAdminTickets();
            const items = response.data?.items || [];
            setTickets(items);
            if (items.length > 0) {
                setSelectedTicket(items[0]);
            }
        } catch (error) {
            console.error("Erro ao carregar chamados:", error);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENTE': return 'bg-rose-500 text-white';
            case 'ALTA': return 'bg-amber-500 text-white';
            case 'MEDIA': return 'bg-blue-500 text-white';
            default: return 'bg-slate-200 text-slate-800';
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
        <div className="flex flex-col h-[calc(100vh-140px)] -m-10 admin-theme">
            <div className="flex h-full border-t border-border/50">
                {/* Coluna Esquerda: Lista */}
                <aside className="w-[400px] flex flex-col border-r border-border bg-card/10 backdrop-blur-md">
                    <div className="p-8 border-b border-border/50 flex flex-col gap-5 bg-primary/5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-foreground">Central de Suporte</h3>
                            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">{tickets.length} Chamados</Badge>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                            <Input placeholder="Buscar por assunto ou cliente..." className="pl-12 h-11 rounded-lg bg-background/50 border-border focus:ring-primary text-sm font-medium" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {tickets.length === 0 ? (
                            <div className="p-12 text-center text-muted-foreground text-sm font-medium opacity-60">
                                Nenhum chamado pendente
                            </div>
                        ) : tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={cn(
                                    "p-6 border-b border-border/30 cursor-pointer transition-all hover:bg-primary/5 group relative",
                                    selectedTicket?.id === ticket.id ? "bg-primary/10 border-l-4 border-l-primary shadow-inner" : ""
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <Badge className={cn("text-xs font-bold py-0.5 px-3 rounded-full shadow-sm", getPriorityColor(ticket.priority))}>
                                        {ticket.priority}
                                    </Badge>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                        {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h4 className="text-sm font-semibold text-foreground mb-2 line-clamp-1 group-hover:translate-x-1 transition-transform">{ticket.subject}</h4>
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Building2 size={14} className="text-primary opacity-60" />
                                    {ticket.tenant_name}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Coluna Direita: Detalhe */}
                <main className="flex-1 flex flex-col bg-background overflow-hidden relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.03)_0%,transparent_50%)] pointer-events-none" />

                    {selectedTicket ? (
                        <>
                            {/* Header do Ticket */}
                            <div className="p-8 bg-card/30 border-b border-border/50 flex items-center justify-between backdrop-blur-md relative z-10">
                                <div className="flex gap-6 items-center">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner border border-primary/20">
                                        <UserCircle2 size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-4 mb-1">
                                            <h2 className="text-xl font-bold tracking-tight text-foreground">{selectedTicket.subject}</h2>
                                            <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider border-primary/30 text-primary bg-primary/5 px-3">{selectedTicket.status}</Badge>
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Aberto por <span className="text-foreground font-semibold">{selectedTicket.user_name}</span> • <span className="text-primary font-semibold">{selectedTicket.tenant_name}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="rounded-lg border-border h-11 px-5 text-sm font-semibold hover:bg-primary/10 transition-all">
                                        Trocar Prioridade
                                    </Button>
                                    <Button className="rounded-lg bg-primary hover:bg-primary/90 text-white h-11 px-5 font-semibold shadow-sm transition-all">
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Finalizar Atendimento
                                    </Button>
                                </div>
                            </div>

                            {/* Chat / Histórico */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10 bg-background/50">
                                {/* Mensagem do Cliente */}
                                <div className="flex gap-5 max-w-[85%]">
                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center border border-border shadow-sm">
                                        <UserCircle2 size={20} className="text-muted-foreground" />
                                    </div>
                                    <div className="bg-card p-6 rounded-2xl rounded-tl-none border border-border/60 shadow-sm space-y-3">
                                        <p className="text-sm text-foreground leading-relaxed">
                                            {selectedTicket.description}
                                        </p>
                                        <span className="text-xs font-medium text-muted-foreground block text-right opacity-70">Enviado em 14:20</span>
                                    </div>
                                </div>

                                {/* Resposta Admin */}
                                <div className="flex gap-5 max-w-[85%] ml-auto flex-row-reverse">
                                    <div className="h-10 w-10 shrink-0 rounded-xl bg-primary flex items-center justify-center shadow-sm border border-primary/20">
                                        <ShieldCheck size={20} className="text-primary-foreground" />
                                    </div>
                                    <div className="bg-primary/10 p-6 rounded-2xl rounded-tr-none border border-primary/20 text-foreground space-y-3 shadow-sm backdrop-blur-sm">
                                        <p className="text-sm leading-relaxed font-medium">
                                            Olá, analisamos o caso e identificamos uma instabilidade no motor de PDF para esse tenant específico. Já estamos aplicando a correção.
                                        </p>
                                        <span className="text-xs font-semibold text-primary block text-right">Suporte Técnico • 14:35</span>
                                    </div>
                                </div>
                            </div>

                            {/* Input de Resposta */}
                            <div className="p-8 bg-card/50 border-t border-border/50 backdrop-blur-md relative z-20">
                                <div className="max-w-4xl mx-auto relative group">
                                    <Textarea
                                        placeholder="Digite sua resposta estrategicamente..."
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        className="rounded-2xl border-border bg-background/50 focus:bg-background h-[120px] p-6 text-sm font-medium resize-none pr-16 shadow-inner group-focus-within:border-primary/50 transition-all"
                                    />
                                    <Button
                                        className="absolute bottom-4 right-4 h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shadow-sm p-0 transition-transform active:scale-95"
                                        disabled={!reply.trim()}
                                    >
                                        <Send size={18} />
                                    </Button>
                                </div>
                                <div className="flex justify-center gap-8 mt-4">
                                    <button className="text-xs font-semibold text-muted-foreground hover:text-primary transition-all">Atalho: /resolvido</button>
                                    <button className="text-xs font-semibold text-muted-foreground hover:text-primary transition-all">Atalho: /aguardando</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-30 pointer-events-none">
                            <LifeBuoy size={80} className="mb-6 animate-[spin_10s_linear_infinite]" />
                            <p className="text-sm font-semibold tracking-wider">Central de Controle Suporte</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
