"use client";

import { useState } from "react";
import { TeamMember, DiariaType } from "@/types/show";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, Utensils, AlertCircle, CheckCircle2 } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface PreShowCrewProps {
    members: TeamMember[];
    onUpdateMember: (memberId: string, updates: Partial<TeamMember>) => void;
    onAddEventual: (name: string, role: string) => void;
}

/**
 * PreShowCrew - Gestão Dinâmica de Escala e Diárias
 * Refatorado na Fase 15 para eliminar débitos técnicos e suportar o Motor de Equipe Fixa.
 */
export default function PreShowCrew({ members, onUpdateMember, onAddEventual }: PreShowCrewProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    // Verificação de segurança para lista vazia (Estado inicial real)
    if (!members || members.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/30">
                <Users size={48} className="text-slate-200 mb-4" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                    Nenhum membro escalado.<br />Importe a equipe fixa ou adicione eventuais.
                </p>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="mt-6 rounded-2xl border-indigo-100 bg-white text-indigo-600 font-bold uppercase italic hover:bg-indigo-50">
                            <Plus className="mr-2 h-4 w-4" /> Add Primeiro Staff
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2rem] border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black italic uppercase tracking-tight">Colaborador Eventual</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            onAddEventual(formData.get("name") as string, formData.get("role") as string);
                            setIsModalOpen(false);
                        }} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome Completo</Label>
                                <Input name="name" placeholder="Ex: João da Silva" className="rounded-xl border-slate-100" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Função / Cargo</Label>
                                <Input name="role" placeholder="Ex: Roadie Freelancer" className="rounded-xl border-slate-100" required />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full rounded-2xl bg-indigo-600 py-6 text-sm font-black uppercase italic shadow-xl shadow-indigo-100">
                                    Adicionar à Escala
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    const handleDiariaChange = (memberId: string, value: string) => {
        onUpdateMember(memberId, { diaria_type: value as DiariaType });
        toast({
            title: "Escala atualizada",
            description: "A diária de alimentação foi salva com sucesso.",
        });
    };

    const handleJustificationSave = (memberId: string, justification: string) => {
        onUpdateMember(memberId, { diaria_justification: justification });
    };

    const handleAddEventualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const role = formData.get("role") as string;

        if (name && role) {
            onAddEventual(name, role);
            setIsModalOpen(false);
            toast({
                title: "Colaborador adicionado",
                description: `${name} foi incluído na escala deste show.`,
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900">
                        Escala & <span className="text-indigo-600">Diárias</span>
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Planejamento logístico de alimentação
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="rounded-2xl border-indigo-100 bg-indigo-50/50 text-indigo-600 font-bold uppercase italic hover:bg-indigo-100">
                            <Plus className="mr-2 h-4 w-4" /> Add Eventual
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2rem] border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black italic uppercase tracking-tight">Colaborador Eventual</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddEventualSubmit} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome Completo</Label>
                                <Input name="name" placeholder="Ex: João da Silva" className="rounded-xl border-slate-100" required />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 ml-1">Função / Cargo</Label>
                                <Input name="role" placeholder="Ex: Roadie Freelancer" className="rounded-xl border-slate-100" required />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full rounded-2xl bg-indigo-600 py-6 text-sm font-black uppercase italic shadow-xl shadow-indigo-100">
                                    Adicionar à Escala
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-3">
                {members.map((member) => (
                    <Card key={member.id} className="group relative overflow-hidden rounded-[1.5rem] border-slate-100 p-5 transition-all hover:shadow-md bg-white">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black uppercase italic text-slate-900 leading-tight">
                                            {member.name}
                                            {member.is_eventual && <span className="ml-2 text-[8px] font-black text-amber-500 border border-amber-200 px-1 rounded">EVENTUAL</span>}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                                    </div>
                                </div>

                                <div className="w-32">
                                    <Select
                                        value={member.diaria_type}
                                        onValueChange={(val) => handleDiariaChange(member.id, val)}
                                    >
                                        <SelectTrigger className="h-9 rounded-xl border-slate-100 bg-slate-50 text-[10px] font-black uppercase ring-0 focus:ring-1 focus:ring-indigo-100">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-slate-100">
                                            <SelectItem value="PADRAO" className="text-[10px] font-bold uppercase">Padrão</SelectItem>
                                            <SelectItem value="MAIS_MEIA" className="text-[10px] font-bold uppercase">+ Meia Diária</SelectItem>
                                            <SelectItem value="MAIS_UMA" className="text-[10px] font-bold uppercase">+ Uma Diária</SelectItem>
                                            <SelectItem value="SEM_DIARIA" className="text-[10px] font-bold uppercase">Sem Diária</SelectItem>
                                            <SelectItem value="OUTRO" className="text-[10px] font-bold uppercase">Outro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {member.diaria_type !== "PADRAO" && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="mb-2 flex items-center gap-1 text-[9px] font-black uppercase text-rose-500">
                                        <AlertCircle className="h-3 w-3" /> Justificativa Obrigatória
                                    </Label>
                                    <Input
                                        defaultValue={member.diaria_justification}
                                        onBlur={(e) => handleJustificationSave(member.id, e.target.value)}
                                        placeholder="Ex: Chegada antecipada para montagem técnica"
                                        className="h-10 rounded-xl border-rose-100 bg-rose-50/30 text-xs placeholder:text-rose-300 focus:border-rose-300 focus:ring-0"
                                    />
                                </div>
                            )}
                        </div>

                        <div className={`absolute right-0 top-0 h-full w-1 ${member.diaria_type === 'PADRAO' ? 'bg-indigo-400' : 'bg-rose-400'}`} />
                    </Card>
                ))}
            </div>
        </div>
    );
}
