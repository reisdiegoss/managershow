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
    DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receipt, Camera, Loader2, Plus } from "lucide-react";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const quickExpenseSchema = z.object({
    description: z.string().min(3, "Descrição muito curta"),
    amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Valor deve ser maior que zero",
    }),
});

type QuickExpenseValues = z.infer<typeof quickExpenseSchema>;

interface QuickExpenseFormProps {
    showId: string;
    onSuccess?: () => void;
}

export function QuickExpenseForm({ showId, onSuccess }: QuickExpenseFormProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const { api } = useApi();
    const { toast } = useToast();

    const form = useForm<QuickExpenseValues>({
        resolver: zodResolver(quickExpenseSchema),
        defaultValues: {
            description: '',
            amount: '0',
        },
    });

    const onSubmit = async (values: QuickExpenseValues) => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('description', values.description);
            formData.append('realized_amount', values.amount);
            formData.append('category', 'OTHER'); // Categoria padrão para custos in-loco
            formData.append('type', 'EXPENSE');
            if (file) {
                formData.append('receipt', file);
            }

            await api.post(`/client/shows/${showId}/transactions`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast({
                title: "Despesa Registrada!",
                description: "Gasto de estrada sincronizado com sucesso.",
                className: "bg-emerald-600 text-white border-0",
            });

            setOpen(false);
            form.reset();
            setFile(null);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast({
                title: "Falha no Envio",
                description: "Não foi possível registar este custo agora.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="fixed bottom-8 right-8 h-16 w-16 rounded-full bg-slate-900 text-white shadow-2xl transition-all hover:scale-110 active:scale-90 md:h-14 md:w-auto md:rounded-2xl md:px-6 md:static">
                    <Plus className="h-6 w-6 md:mr-2 md:h-5 md:w-5" />
                    <span className="hidden md:inline font-black uppercase tracking-widest text-[11px]">Despesa de Estrada</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-0 overflow-hidden border-0">
                <div className="bg-slate-900 p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                            Custo <span className="text-rose-400">Na Estrada</span>
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                        Lançamento Rápido de Recibo
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6 bg-white">
                    <div className="space-y-4">
                        {/* Captura de Recibo */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Foto do Recibo / Comprovante</Label>
                            <div
                                onClick={() => document.getElementById('receipt-upload')?.click()}
                                className={cn(
                                    "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer",
                                    file ? "border-emerald-400 bg-emerald-50" : "border-slate-100 hover:border-indigo-400"
                                )}
                            >
                                <input
                                    type="file"
                                    id="receipt-upload"
                                    className="hidden"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                {file ? (
                                    <>
                                        <Receipt className="h-8 w-8 text-emerald-600 mb-2" />
                                        <p className="text-xs font-bold text-emerald-700 truncate max-w-full px-4">{file.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <Camera className="h-8 w-8 text-slate-300 mb-2" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tirar Foto ou Galeria</p>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                {...form.register("amount")}
                                className="rounded-2xl border-slate-100 h-14 text-lg font-black italic"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">O que foi pago?</Label>
                            <Input
                                placeholder="Ex: Taxi Aeroporto Salvador"
                                {...form.register("description")}
                                className="rounded-2xl border-slate-100 h-14"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sincronizar Gasto"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
