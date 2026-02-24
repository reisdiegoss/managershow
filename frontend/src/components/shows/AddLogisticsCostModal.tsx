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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";

const costSchema = z.object({
    category: z.string().min(1, "Escolha uma categoria"),
    description: z.string().min(3, "Descrição muito curta"),
    realized_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Valor deve ser maior que zero",
    }),
    transaction_date: z.date(),
});

type CostFormValues = z.infer<typeof costSchema>;

interface AddLogisticsCostModalProps {
    showId: string;
    onSuccess?: () => void;
}

export function AddLogisticsCostModal({ showId, onSuccess }: AddLogisticsCostModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { api } = useApi();
    const { toast } = useToast();

    const form = useForm<CostFormValues>({
        resolver: zodResolver(costSchema),
        defaultValues: {
            category: 'OTHER',
            description: '',
            realized_amount: '0',
            transaction_date: new Date(),
        },
    });

    const onSubmit = async (values: CostFormValues) => {
        try {
            setLoading(true);
            // Rota conforme especificado: POST /shows/{id}/transactions
            await api.post(`/client/shows/${showId}/transactions`, {
                ...values,
                realized_amount: Number(values.realized_amount),
                transaction_date: format(values.transaction_date, "yyyy-MM-dd"),
                type: 'EXPENSE', // Garantindo que seja uma despesa
            });

            toast({
                title: "Despesa Lançada!",
                description: "Custo de logística registrado no orçamento do show.",
            });

            setOpen(false);
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast({
                title: "Erro no Lançamento",
                description: "Não foi possível registrar a despesa.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl bg-slate-900 px-6 font-black italic uppercase tracking-tighter text-white shadow-lg transition-all hover:bg-black hover:scale-105 active:scale-95">
                    <Plus className="mr-2 h-4 w-4" />
                    Lançar Despesa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-slate-200 bg-white shadow-2xl overflow-hidden p-0">
                <div className="bg-slate-900 p-8 text-white relative">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                            Novo <span className="text-indigo-400">Custo</span>
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs font-bold text-slate-400 italic mt-2 uppercase tracking-widest">
                        Fluxo de Caixa Operacional
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoria da Despesa</Label>
                        <Select onValueChange={(v) => form.setValue("category", v as any)} defaultValue="OTHER">
                            <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FLIGHT">Voo / Passagens</SelectItem>
                                <SelectItem value="HOTEL">Hospedagem / Hotel</SelectItem>
                                <SelectItem value="VAN">Transfer / Van / Carrinha</SelectItem>
                                <SelectItem value="BACKLINE">Backline / Equipamento</SelectItem>
                                <SelectItem value="CREW_PAYMENT">Equipe / Diárias</SelectItem>
                                <SelectItem value="OTHER">Outras Despesas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Descrição / Justificativa</Label>
                        <Input
                            placeholder="Ex: Reserva Hotel Ibis Copacabana"
                            {...form.register("description")}
                            className="rounded-xl border-slate-200 h-11 focus:ring-slate-900"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data da Compra</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl border-slate-200 h-11",
                                            !form.watch("transaction_date") && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                                        {form.watch("transaction_date") ? format(form.watch("transaction_date"), "dd/MM/yy", { locale: ptBR }) : <span>Escolha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={form.watch("transaction_date")}
                                        onSelect={(date) => date && form.setValue("transaction_date", date)}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Valor Real (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                {...form.register("realized_amount")}
                                className="rounded-xl border-slate-200 h-11 focus:ring-slate-900 font-bold"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex items-center gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            className="flex-1 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] h-12 rounded-2xl bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.1em] shadow-xl transition-all hover:bg-indigo-700 active:scale-95"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Efetivar Gasto"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
