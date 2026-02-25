"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserPlus } from "lucide-react";

const contractorSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    document: z.string().optional(),
    email: z.string().email("E-mail inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
});

type ContractorFormValues = z.infer<typeof contractorSchema>;

interface NewContractorModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (contractorId: string) => void;
}

export function NewContractorModal({ open, onOpenChange, onSuccess }: NewContractorModalProps) {
    const [loading, setLoading] = useState(false);
    const { api } = useApi();
    const { toast } = useToast();

    const form = useForm<ContractorFormValues>({
        resolver: zodResolver(contractorSchema),
        defaultValues: {
            name: "",
            document: "",
            email: "",
            phone: "",
        },
    });

    const onSubmit = async (data: ContractorFormValues) => {
        try {
            setLoading(true);
            const response = await api.post("/client/contractors/", data);
            toast({
                title: "Contratante Criado!",
                description: `${data.name} agora está disponível para seleção.`,
            });
            onSuccess(response.data.id);
            onOpenChange(false);
            form.reset();
        } catch (error: any) {
            toast({
                title: "Erro ao criar",
                description: error.response?.data?.detail || "Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl border-white/10 glass-card">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-100 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-indigo-500" />
                        Novo <span className="text-indigo-500">Contratante</span>
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Contratante</Label>
                        <Input {...form.register("name")} className="rounded-xl border-slate-200 h-11" placeholder="Ex: João da Silva" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">CPF / CNPJ</Label>
                        <Input {...form.register("document")} className="rounded-xl border-slate-200 h-11" placeholder="Somente números" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">E-mail</Label>
                            <Input {...form.register("email")} className="rounded-xl border-slate-200 h-11" placeholder="email@exemplo.com" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Telefone</Label>
                            <Input {...form.register("phone")} className="rounded-xl border-slate-200 h-11" placeholder="(00) 00000-0000" />
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-2 rounded-2xl bg-indigo-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-700">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Contratante"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
