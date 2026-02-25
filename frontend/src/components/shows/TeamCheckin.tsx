"use client";

import { useState } from "react";
import { TeamMember, CacheType } from "@/types/show";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Users2, CheckCircle2, XCircle, AlertTriangle, Zap, MinusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * TeamCheckin - Fechamento de Estrada Dinâmico
 * Refatorado na Fase 15 para integrar com o Motor de Equipe e JSONB.
 */
interface TeamCheckinProps {
    showId: string;
    teamMembers: TeamMember[];
    onUpdateCache: (id: string, type: CacheType) => void;
}

/**
 * Mapeamento de cores e ícones para cada tipo de cachê
 */
const cacheOptions = [
    { type: 'PADRAO' as CacheType, label: 'Padrão', color: 'bg-emerald-500', icon: CheckCircle2, textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
    { type: 'MEIO' as CacheType, label: 'Meio', color: 'bg-amber-500', icon: AlertTriangle, textColor: 'text-amber-700', bgColor: 'bg-amber-50' },
    { type: 'DOBRADO' as CacheType, label: '2x', color: 'bg-purple-600', icon: Zap, textColor: 'text-purple-700', bgColor: 'bg-purple-50' },
    { type: 'SEM_CACHE' as CacheType, label: 'Zero', color: 'bg-slate-400', icon: MinusCircle, textColor: 'text-slate-600', bgColor: 'bg-slate-100' },
    { type: 'FALTOU' as CacheType, label: 'Faltou', color: 'bg-rose-500', icon: XCircle, textColor: 'text-rose-700', bgColor: 'bg-rose-50' },
];

export function TeamCheckin({ showId, teamMembers, onUpdateCache }: TeamCheckinProps) {
    const { toast } = useToast();

    // Cálculo de progresso (Membros que já tiveram o cachê definido)
    const definedCount = teamMembers.filter(m => m.cache_type !== 'PENDENTE').length;
    const progressValue = (definedCount / teamMembers.length) * 100;

    const handleCacheSelect = (id: string, type: CacheType, name: string) => {
        onUpdateCache(id, type);
        toast({
            title: "Cachê Definido",
            description: `Cachê de ${name} atualizado para ${type}.`,
            className: "bg-slate-900 text-white border-0",
        });
    };

    return (
        <Card className="rounded-[2.5rem] border-slate-100 p-6 md:p-8 shadow-sm space-y-8 bg-white/50 backdrop-blur-sm">
            {/* Header com Progresso */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Fechamento de Estrada</h3>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {definedCount}/{teamMembers.length} Finalizados
                    </p>
                </div>
                <Progress value={progressValue} className="h-2 bg-slate-100" />
            </div>

            {/* Lista de Membros */}
            <div className="space-y-6">
                {teamMembers.map((member) => (
                    <div key={member.id} className="space-y-3">
                        {/* Info do Membro */}
                        <div className="flex items-center gap-4 px-2">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm shrink-0">
                                <AvatarFallback className="bg-slate-100 text-[10px] font-black text-slate-400">
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-slate-900 italic uppercase truncate leading-none">
                                    {member.name}
                                </p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {member.role}
                                </p>
                            </div>
                            {member.cache_type !== 'PENDENTE' && (
                                <div className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full animate-in zoom-in duration-300",
                                    cacheOptions.find(o => o.type === member.cache_type)?.color || "bg-slate-200"
                                )}>
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Seleção de Cachê (Touch Targets >= 44px) */}
                        <div className="grid grid-cols-5 gap-2">
                            {cacheOptions.map((opt) => {
                                const isSelected = member.cache_type === opt.type;
                                return (
                                    <button
                                        key={opt.type}
                                        onClick={() => handleCacheSelect(member.id, opt.type, member.name)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1 rounded-2xl border-2 py-3 transition-all active:scale-95",
                                            "min-h-[54px]", // Garantindo área de toque
                                            isSelected
                                                ? `${opt.bgColor} border-transparent shadow-inner`
                                                : "bg-white border-slate-50 text-slate-300 hover:border-slate-200"
                                        )}
                                    >
                                        <opt.icon className={cn("h-5 w-5", isSelected ? opt.textColor : "text-slate-200")} />
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-tighter",
                                            isSelected ? opt.textColor : "text-slate-400"
                                        )}>
                                            {opt.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
