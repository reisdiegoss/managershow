"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
    SelectValue
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ProfitLight } from "./ProfitLight";
import { Plus, Calculator, Sparkles, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema de validação estrito baseado no Backend e no Módulo 1 do PRD
const showSchema = z.object({
    artist_id: z.string().min(1, "Selecione o artista"),
    date_start: z.date({
        required_error: "Data de início é obrigatória",
    }),
    location_city: z.string().min(2, "Cidade é obrigatória"),
    location_uf: z.string().length(2, "UF deve ter 2 caracteres"),
    base_price: z.coerce.number().min(1, "Preço base é obrigatório"),
    client_type: z.enum(["PUBLIC", "PRIVATE"]),
    negotiation_type: z.enum(["CACHE_FIXO", "CACHE_DESPESAS", "COLOCADO_TOTAL", "BILHETERIA", "CACHE_MAIS_PERCENTUAL"]),
});

type ShowFormValues = z.infer<typeof showSchema>;

/**
 * NewShowDialog - O Portal de entrada para novos eventos.
 * Inclui o Simulador de Viabilidade (Semáforo) em tempo real.
 */
export function NewShowDialog({ onShowCreated }: { onShowCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<{ score: number; message: string } | null>(null);

    const { simulateShow, createShow } = useApi();
    const { toast } = useToast();

    const form = useForm<ShowFormValues>({
        resolver: zodResolver(showSchema),
        defaultValues: {
            client_type: "PRIVATE",
            base_price: 0,
            location_uf: "SP",
            negotiation_type: "CACHE_FIXO",
        },
    });

    // Observa mudanças para simulação automática
    const watchCity = form.watch("location_city");
    const watchPrice = form.watch("base_price");
    const watchUF = form.watch("location_uf");
    const watchType = form.watch("client_type");

    /**
     * Efeito Semáforo: Dispara a simulação de BI ao mudar cidade ou preço.
     */
    useEffect(() => {
        if (watchCity && watchUF && watchPrice > 0) {
            const timer = setTimeout(async () => {
                try {
                    setSimulating(true);
                    const response = await simulateShow({
                        location_city: watchCity,
                        location_uf: watchUF,
                        base_price: watchPrice,
                        client_type: watchType
                    });
                    setSimulationResult(response.data);
                } catch (error) {
                    console.error("Erro na simulação:", error);
                } finally {
                    setSimulating(false);
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [watchCity, watchUF, watchPrice, watchType]);

    async function onSubmit(data: ShowFormValues) {
        try {
            setLoading(true);
            await createShow({
                ...data,
                status: "SONDAGEM", // Status inicial padrão
                date_show: format(data.date_start, "yyyy-MM-dd"), // Adaptando para o campo esperado no backend
            });

            toast({
                title: "Show Registrado!",
                description: "Evento adicionado ao funil de Sondagem com sucesso.",
            });

            setOpen(false);
            form.reset();
            setSimulationResult(null);
            if (onShowCreated) onShowCreated();
        } catch (error: any) {
            toast({
                title: "Erro na Efetivação",
                description: error.response?.data?.detail || "Falha ao salvar no banco de dados.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl bg-indigo-600 px-6 font-black italic uppercase tracking-tighter text-white shadow-lg transition-all hover:bg-indigo-700 hover:scale-105 active:scale-95">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Ação
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] border-slate-200 bg-white shadow-2xl overflow-hidden p-0">
                <div className="bg-indigo-600 p-8 text-white relative">
                    <Sparkles className="absolute top-4 right-4 h-12 w-12 text-white/10" />
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                            Agenda <span className="text-indigo-200">Comercial</span>
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs font-bold text-indigo-100/80 italic mt-2 uppercase tracking-widest">
                        Simulador de Viabilidade e Registro de Show
                    </p>
                </div>

                <form onSubmit={form.handleSubmit((data) => onSubmit(data))} className="p-8 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Artista / Atração</Label>
                            <Select onValueChange={(v) => form.setValue("artist_id", v)}>
                                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                    <SelectValue placeholder="Selecione o Artista" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ARTIST_001">Artista Gold (Headliner)</SelectItem>
                                    <SelectItem value="ARTIST_002">Artista Silver (Support)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data do Show</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal rounded-xl border-slate-200 h-11",
                                            !form.watch("date_start") && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                                        {form.watch("date_start") ? format(form.watch("date_start"), "PPP", { locale: ptBR }) : <span>Escolha a data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={form.watch("date_start")}
                                        onSelect={(date: Date | undefined) => date && form.setValue("date_start", date)}
                                        initialFocus
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade (Praça)</Label>
                            <Input
                                placeholder="Ex: Goiânia"
                                {...form.register("location_city")}
                                className="rounded-xl border-slate-200 h-11 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">UF</Label>
                            <Input
                                placeholder="GO"
                                maxLength={2}
                                {...form.register("location_uf")}
                                className="rounded-xl border-slate-200 h-11 focus:ring-indigo-500 uppercase"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modelo de Negócio</Label>
                            <Select
                                onValueChange={(v) => form.setValue("negotiation_type", v as any)}
                                defaultValue="CACHE_FIXO"
                            >
                                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CACHE_FIXO">Cachê Fixo</SelectItem>
                                    <SelectItem value="CACHE_DESPESAS">Cachê + Despesas</SelectItem>
                                    <SelectItem value="COLOCADO_TOTAL">Colocado Total</SelectItem>
                                    <SelectItem value="BILHETERIA">Bilheteria (Venda)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Contrato</Label>
                            <Select
                                onValueChange={(v) => form.setValue("client_type", v as any)}
                                defaultValue="PRIVATE"
                            >
                                <SelectTrigger className="rounded-xl border-slate-200 h-11">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRIVATE">Venda Direta / Privado</SelectItem>
                                    <SelectItem value="PUBLIC">Governo / Prefeitura</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-right block w-full">Cachê Base (BRL)</Label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                            <Input
                                type="number"
                                placeholder="0,00"
                                {...form.register("base_price")}
                                className="pl-12 rounded-xl border-slate-200 h-12 focus:ring-indigo-500 text-right font-black text-lg"
                            />
                        </div>
                    </div>

                    {/* Semáforo de Viabilidade BI */}
                    <ProfitLight
                        loading={simulating}
                        score={simulationResult?.score}
                        message={simulationResult?.message}
                    />

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
                            className="flex-[2] h-12 rounded-2xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.1em] shadow-xl transition-all hover:bg-black active:scale-95"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Efetivar Negociação"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
