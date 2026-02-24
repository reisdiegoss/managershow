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
    Search
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SaaSTicket } from '@/types/admin';
import { cn } from '@/lib/utils';

const mockTickets: SaaSTicket[] = [
    {
        id: '1',
        tenant_id: '1',
        tenant_name: 'Vima Sistemas',
        subject: 'Erro ao gerar PDF de contrato',
        description: 'Quando tento gerar o PDF do show #1234, o sistema retorna erro 500.',
        status: 'EM_ATENDIMENTO',
        priority: 'URGENTE',
        created_at: '2026-02-24T10:30:00Z',
        user_name: 'Diego Reis'
    },
    {
        id: '2',
        tenant_id: '2',
        tenant_name: 'Opus Entretenimento',
        subject: 'Dúvida sobre comissões',
        description: 'Gostaria de saber como o cálculo de comissão líquida é aplicado no DRE.',
        status: 'ABERTO',
        priority: 'MEDIA',
        created_at: '2026-02-24T14:20:00Z',
        user_name: 'Ricardo M.'
    },
    {
        id: '3',
        tenant_id: '3',
        tenant_name: 'G7 Produções',
        subject: 'Aumento de limite de usuários',
        description: 'Precisamos adicionar mais 2 produtores ao sistema, o plano starter está cheio.',
        status: 'ABERTO',
        priority: 'ALTA',
        created_at: '2026-02-23T16:45:00Z',
        user_name: 'Ana Julia'
    },
];

export default function TicketsAdminPage() {
    const [selectedTicket, setSelectedTicket] = useState<SaaSTicket | null>(mockTickets[0]);
    const [reply, setReply] = useState('');

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENTE': return 'bg-rose-500 text-white';
            case 'ALTA': return 'bg-amber-500 text-white';
            case 'MEDIA': return 'bg-blue-500 text-white';
            default: return 'bg-slate-200 text-slate-800';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] -m-10">
            <div className="flex h-full border-t border-slate-200">
                {/* Coluna Esquerda: Lista */}
                <aside className="w-[400px] flex flex-col border-r border-slate-200 bg-white">
                    <div className="p-6 border-b border-slate-100 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black italic uppercase text-slate-900 tracking-tight">Central de Support</h3>
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black uppercase">12 Novos</Badge>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <Input placeholder="Filtrar chamados..." className="pl-10 h-10 rounded-xl bg-slate-50 border-0 text-xs" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {mockTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={cn(
                                    "p-6 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50",
                                    selectedTicket?.id === ticket.id ? "bg-emerald-50/30 border-l-4 border-l-emerald-500 shadow-inner" : ""
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <Badge className={cn("text-[8px] font-black uppercase py-0.5 px-2 rounded-full", getPriorityColor(ticket.priority))}>
                                        {ticket.priority}
                                    </Badge>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                        {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h4 className="text-xs font-black italic uppercase text-slate-900 mb-1 line-clamp-1">{ticket.subject}</h4>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    <Building2 size={10} className="text-slate-400" />
                                    {ticket.tenant_name}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Coluna Direita: Detalhe */}
                <main className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
                    {selectedTicket ? (
                        <>
                            {/* Header do Ticket */}
                            <div className="p-8 bg-white border-b border-slate-200 flex items-center justify-between">
                                <div className="flex gap-5 items-center">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">{selectedTicket.subject}</h2>
                                            <Badge variant="outline" className="text-[9px] font-black uppercase">{selectedTicket.status}</Badge>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Aberto por <span className="text-slate-900">{selectedTicket.user_name}</span> • {selectedTicket.tenant_name}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button variant="outline" className="rounded-xl border-slate-200 text-xs font-black uppercase italic">
                                        Trocar Prioridade
                                    </Button>
                                    <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black uppercase italic shadow-lg shadow-emerald-100">
                                        <CheckCircle2 className="mr-2 h-4 w-4" /> Resolver Ticket
                                    </Button>
                                </div>
                            </div>

                            {/* Chat / Histórico */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                                {/* Mensagem do Cliente */}
                                <div className="flex gap-4 max-w-[80%]">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 flex items-center justify-center">
                                        <User size={18} className="text-slate-500" />
                                    </div>
                                    <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-slate-100 shadow-sm space-y-3">
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                            {selectedTicket.description}
                                        </p>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block text-right italic">Enviado em 14:20</span>
                                    </div>
                                </div>

                                {/* Placeholder de Resposta Admin */}
                                <div className="flex gap-4 max-w-[80%] ml-auto flex-row-reverse">
                                    <div className="h-10 w-10 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                        <ShieldCheck size={18} className="text-slate-950" />
                                    </div>
                                    <div className="bg-slate-900 p-6 rounded-[2rem] rounded-tr-none text-white space-y-3 shadow-xl">
                                        <p className="text-sm leading-relaxed font-medium">
                                            Olá, analisamos o caso e identificamos uma instabilidade no motor de PDF para esse tenant específico. Já estamos aplicando a correção.
                                        </p>
                                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block italic">Suporte Técnico • 14:35</span>
                                    </div>
                                </div>
                            </div>

                            {/* Input de Resposta */}
                            <div className="p-8 bg-white border-t border-slate-200">
                                <div className="max-w-4xl mx-auto relative">
                                    <Textarea
                                        placeholder="Digite sua resposta para o cliente..."
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        className="rounded-3xl border-slate-100 bg-slate-50 focus:bg-white min-h-[120px] p-6 text-sm resize-none pr-14"
                                    />
                                    <Button
                                        className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 p-0"
                                        disabled={!reply.trim()}
                                    >
                                        <Send size={18} />
                                    </Button>
                                </div>
                                <div className="flex justify-center gap-6 mt-4">
                                    <button className="text-[9px] font-black uppercase text-slate-400 hover:text-emerald-600 transition-all tracking-widest">Atalho: /resolvido</button>
                                    <button className="text-[9px] font-black uppercase text-slate-400 hover:text-emerald-600 transition-all tracking-widest">Atalho: /aguardando</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 opacity-50">
                            <LifeBuoy size={80} className="mb-4" />
                            <p className="text-sm font-black uppercase italic tracking-widest">Selecione um ticket para visualizar</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
