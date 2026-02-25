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
import { Loader2, Landmark } from "lucide-react";

const venueSchema = z.object({
    name: z.string().min(2, "Nome é obrigatório"),
    city: z.string().min(2, "Cidade é obrigatória"),
    state: z.string().length(2, "Estado (UF) deve ter 2 caracteres"),
    capacity: z.coerce.number().optional(),
});

type VenueFormValues = z.infer<typeof venueSchema>;

interface NewVenueModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (venueId: string) => void;
}

export function NewVenueModal({ open, onOpenChange, onSuccess }: NewVenueModalProps) {
    const [loading, setLoading] = useState(false);
    const { api } = useApi();
    const { toast } = useToast();

    const form = useForm<VenueFormValues>({
        resolver: zodResolver(venueSchema),
        defaultValues: {
            name: "",
            city: "",
            state: "SP",
            capacity: 0,
        },
    });

    const onSubmit = async (data: VenueFormValues) => {
        try {
            setLoading(true);
            const response = await api.post("/client/venues/", data);
            toast({
                title: "Local Criado!",
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
                        <Landmark className="h-5 w-5 text-indigo-500" />
                        Novo <span className="text-indigo-500">Local</span>
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nome do Local</Label>
                        <Input {...form.register("name")} className="rounded-xl border-slate-200 h-11" placeholder="Ex: Arena Manager" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade</Label>
                            <Input {...form.register("city")} className="rounded-xl border-slate-200 h-11" placeholder="Ex: Goiânia" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">UF / Estado</Label>
                            <Input {...form.register("state")} maxLength={2} className="rounded-xl border-slate-200 h-11 uppercase" placeholder="GO" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capacidade (Público)</Label>
                        <Input type="number" {...form.register("capacity")} className="rounded-xl border-slate-200 h-11" placeholder="0" />
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 rounded-2xl font-bold uppercase text-[10px] tracking-widest">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="flex-2 rounded-2xl bg-indigo-600 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-indigo-700">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Local"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
