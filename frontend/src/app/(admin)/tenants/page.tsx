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
    Filter
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
import { SaaSTenant } from '@/types/admin';

const mockTenants: SaaSTenant[] = [
    {
        id: '1',
        name: 'Vima Sistemas & Produções',
        document: '12.345.678/0001-90',
        email: 'contato@vima.com.br',
        status: 'ACTIVE',
        plan: 'ENTERPRISE',
        max_users: 50,
        created_at: '2025-01-10'
    },
    {
        id: '2',
        name: 'Opus Entretenimento',
        document: '98.765.432/0001-11',
        email: 'comercial@opus.com.br',
        status: 'ACTIVE',
        plan: 'PRO',
        max_users: 15,
        created_at: '2025-05-20'
    },
    {
        id: '3',
        name: 'G7 Produções Artísticas',
        document: '44.555.666/0001-22',
        email: 'atendimento@g7.com',
        status: 'SUSPENDED',
        plan: 'STARTER',
        max_users: 5,
        created_at: '2026-02-15'
    },
    {
        id: '4',
        name: 'ShowCase Brasil',
        document: '11.222.333/0001-44',
        email: 'diretoria@showcase.com',
        status: 'TRIAL',
        plan: 'STARTER',
        max_users: 5,
        created_at: '2026-02-22'
    },
];

export default function TenantsAdminPage() {
    const [tenants] = useState<SaaSTenant[]>(mockTenants);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                        Gestão de <span className="text-emerald-600">Produtoras</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Ecossistema de Tenants do Manager Show
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors" size={16} />
                        <Input
                            placeholder="Buscar por nome ou CNPJ..."
                            className="pl-12 w-[300px] h-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-emerald-500"
                        />
                    </div>
                    <Button className="rounded-2xl bg-slate-900 border-0 h-12 px-6 font-bold uppercase italic shadow-lg hover:bg-emerald-600 transition-all">
                        <Plus className="mr-2 h-5 w-5" /> Novo Tenant
                    </Button>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-0">
                            <TableHead className="w-[80px] text-center"></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Produtora / Identificador</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plano / Limites</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status SaaS</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cadastro</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tenants.map((t) => (
                            <TableRow key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                <TableCell className="py-6 flex justify-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all">
                                        <Building2 size={24} />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-black text-slate-900 italic uppercase leading-none mb-1">{t.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.document}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        <Badge variant="outline" className="w-fit bg-slate-50 text-[10px] font-black border-slate-200 uppercase italic">
                                            {t.plan}
                                        </Badge>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{t.max_users} usuários permitidos</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {t.status === 'ACTIVE' && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <ShieldCheck size={12} />
                                                <span className="text-[10px] font-black uppercase italic">Ativo</span>
                                            </div>
                                        )}
                                        {t.status === 'SUSPENDED' && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                                                <ShieldAlert size={12} />
                                                <span className="text-[10px] font-black uppercase italic">Suspenso</span>
                                            </div>
                                        )}
                                        {t.status === 'TRIAL' && (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                                <Activity size={12} />
                                                <span className="text-[10px] font-black uppercase italic">Trial</span>
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-[11px] font-black italic text-slate-500 uppercase">
                                        {new Date(t.created_at).toLocaleDateString('pt-BR')}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600">
                                                <MoreVertical size={20} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-xl p-2 min-w-[200px]">
                                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400 px-4 py-2">Gerenciar Tenant</DropdownMenuLabel>
                                            <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer group">
                                                <CreditCard className="mr-3 h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                                                <span className="text-xs font-bold uppercase italic">Editar Plano</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer group text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                                <Ban className="mr-3 h-4 w-4" />
                                                <span className="text-xs font-bold uppercase italic">Bloquear Acesso</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-slate-50 my-2" />
                                            <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer group">
                                                <ExternalLink className="mr-3 h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
                                                <span className="text-xs font-bold uppercase italic">Ver Detalhes</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
