'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    MoreVertical,
    DollarSign,
    ShieldCheck,
    Trash2,
    Edit2,
    Search,
    ChevronLeft
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
import Link from 'next/link';

// Tipagem local para desenvolvimento
interface CrewMember {
    id: string;
    name: string;
    role: string;
    base_cache: number;
    base_diaria: number;
    is_active: boolean;
}

const mockCrew: CrewMember[] = [
    { id: '1', name: 'Ricardo M.', role: 'Técnico de Som', base_cache: 500.00, base_diaria: 100.00, is_active: true },
    { id: '2', name: 'Ana Flávia', role: 'Vocal de Apoio', base_cache: 800.00, base_diaria: 100.00, is_active: true },
    { id: '3', name: 'João Drummer', role: 'Baterista', base_cache: 700.00, base_diaria: 100.00, is_active: true },
];

export default function ArtistCrewPage({ params }: { params: { id: string } }) {
    const [crew, setCrew] = useState<CrewMember[]>(mockCrew);

    return (
        <div className="space-y-8">
            {/* Header com Navegação */}
            <div className="flex flex-col gap-6">
                <Link
                    href={`/artistas/${params.id}`}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-emerald-500 transition-colors w-fit"
                >
                    <ChevronLeft size={14} /> Voltar ao Perfil
                </Link>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                            Equipe <span className="text-emerald-600">Fixa</span>
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                            <Users size={14} className="text-emerald-500" /> Folha de Pagamento Base do Artista
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-emerald-500 transition-colors" size={16} />
                            <Input
                                placeholder="Buscar membro..."
                                className="pl-12 w-[250px] h-12 rounded-2xl border-slate-100 bg-white shadow-sm focus:ring-emerald-500"
                            />
                        </div>
                        <Button className="rounded-2xl bg-slate-900 border-0 h-12 px-6 font-bold uppercase italic shadow-lg hover:bg-emerald-600 transition-all">
                            <UserPlus className="mr-2 h-5 w-5" /> Adicionar Staff
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabela de Equipe */}
            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-0">
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6 px-8">Membro / Função</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cachê Base (BRL)</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Diária Base (BRL)</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500">Status</TableHead>
                            <TableHead className="w-[80px] px-8"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {crew.map((member) => (
                            <TableRow key={member.id} className="border-b border-slate-50 hover:bg-emerald-50/10 transition-colors group">
                                <TableCell className="py-6 px-8">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-900 italic uppercase leading-none mb-1">{member.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-bold tabular-nums text-slate-700 italic">
                                        R$ {member.base_cache.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-sm font-bold tabular-nums text-slate-700 italic">
                                        R$ {member.base_diaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-[10px] font-black uppercase italic text-emerald-600">Ativo</span>
                                    </div>
                                </TableCell>
                                <TableCell className="px-8 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                                                <MoreVertical size={18} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-xl p-2 min-w-[180px]">
                                            <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer group">
                                                <Edit2 className="mr-3 h-4 w-4 text-slate-400 group-hover:text-emerald-500" />
                                                <span className="text-xs font-bold uppercase italic">Editar Dados</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="rounded-xl px-4 py-3 cursor-pointer group text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                                <Trash2 className="mr-3 h-4 w-4" />
                                                <span className="text-xs font-bold uppercase italic">Remover Staff</span>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Info Box */}
            <div className="p-8 rounded-[2rem] bg-slate-900 text-white flex items-center justify-between shadow-2xl shadow-slate-200">
                <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center">
                        <DollarSign size={24} className="text-slate-950" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tight">Regra de Cálculo Automático</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            Estes valores serão pré-carregados no fechamento de cada show.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 italic">Total Fixo por Show</span>
                    <span className="text-2xl font-black italic tabular-nums">
                        R$ {crew.reduce((acc, m) => acc + m.base_cache + m.base_diaria, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
}
