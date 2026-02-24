"use client";

import { useState } from "react";
import { TeamMember } from "@/types/show";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Users2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamCheckinProps {
    showId: string;
}

const mockTeam: TeamMember[] = [
    { id: '1', name: 'Diego Reis', role: 'Road Manager', isPresent: true },
    { id: '2', name: 'Alok Petrillo', role: 'Artista', isPresent: true },
    { id: '3', name: 'Zezé Di Camargo', role: 'Vocalista', isPresent: false },
    { id: '4', name: 'Luciano', role: 'Segunda Voz', isPresent: false },
    { id: '5', name: 'Carlos Tech', role: 'Luz & Vídeo', isPresent: true },
];

export function TeamCheckin({ showId }: TeamCheckinProps) {
    const [team, setTeam] = useState<TeamMember[]>(mockTeam);
    const { api } = useApi();
    const { toast } = useToast();

    const presentCount = team.filter(m => m.isPresent).length;
    const progressValue = (presentCount / team.length) * 100;

    const handleToggle = async (id: string) => {
        // Optimistic UI Update
        const oldTeam = [...team];
        const newTeam = team.map(m =>
            m.id === id ? { ...m, isPresent: !m.isPresent } : m
        );
        setTeam(newTeam);

        const member = newTeam.find(m => m.id === id);

        try {
            // Simulação de chamada API para salvar presença
            // await api.patch(`/client/shows/${showId}/team/${id}`, { isPresent: member?.isPresent });

            toast({
                title: "Presença Atualizada",
                description: `${member?.name} marcado como ${member?.isPresent ? 'Presente' : 'Ausente'}.`,
                className: "bg-slate-900 text-white border-0",
            });
        } catch (error) {
            // Revert in case of failure
            setTeam(oldTeam);
            toast({
                title: "Erro no Check-in",
                description: "Não foi possível sincronizar o status com o servidor.",
                variant: "destructive",
            });
        }
    };

    return (
        <Card className="rounded-[2.5rem] border-slate-100 p-8 shadow-sm space-y-8">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users2 className="h-5 w-5 text-indigo-600" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Check-in de Equipe</h3>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {presentCount}/{team.length} Presentes
                    </p>
                </div>
                <Progress value={progressValue} className="h-2 bg-slate-100" />
            </div>

            <div className="space-y-4">
                {team.map((member) => (
                    <div
                        key={member.id}
                        className={cn(
                            "flex items-center justify-between p-4 rounded-3xl border transition-all",
                            member.isPresent ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-50"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                <AvatarFallback className={cn(
                                    "text-xs",
                                    member.isPresent ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                                )}>
                                    {member.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-black text-slate-900 italic uppercase tracking-tight leading-none">
                                    {member.name}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {member.role}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {member.isPresent && (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in" />
                            )}
                            <Switch
                                checked={member.isPresent}
                                onCheckedChange={() => handleToggle(member.id)}
                                className="scale-125 focus:ring-emerald-500"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
