"use client";

import { useState, useEffect } from "react";
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
    SelectValue
} from "@/components/ui/select";
import { useApi } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { ProfitLight } from "./ProfitLight";
import { Plus, Calculator, Sparkles } from "lucide-react";

// Schema de validação principal (Apenas campos do Show)
const showSchema = z.object({
    date_show: z.string().min(1, "Data é obrigatória"),
    location_city: z.string().min(2, "Cidade é obrigatória"),
    location_uf: z.string().length(2, "UF deve ter 2 caracteres"),
    base_price: z.coerce.number().min(1, "Preço base é obrigatório"),
    client_type: z.enum(["PUBLIC", "PRIVATE"]),
    negotiation_type: z.string().optional(),
});

type ShowFormValues = z.infer<typeof showSchema>;

/**
 * NewShowModal - Modal responsável pela entrada de novos shows com verificação de semáforo.
 */
export function NewShowModal({ onShowCreated }: { onShowCreated?: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<{ score: number; message: string; breakdown?: any } | null>(null);

    // Variáveis desamarradas do Form p/ não quebrar a tipagem de submit do Show
    const [transportType, setTransportType] = useState("AEREO");
    const [flightsCount, setFlightsCount] = useState(0);
    const [daysHotel, setDaysHotel] = useState(1);

    const { simulateShow, createShow } = useApi();
    const { toast } = useToast();

    const form = useForm<ShowFormValues>({
        resolver: zodResolver(showSchema),
        defaultValues: {
            client_type: "PRIVATE",
            base_price: 0,
            location_uf: "SP",
        },
    });

    // Watch fields for automatic simulation
    const watchFields = form.watch(["location_city", "location_uf", "base_price", "client_type"]);

    /**
     * Debounce da simulação para não sobrecarregar a API
     */
    useEffect(() => {
        const { location_city, location_uf, base_price, client_type, transport_type, flights_count, days_hotel } = form.getValues();

        if (location_city && location_uf && base_price > 0) {
            const timer = setTimeout(async () => {
                try {
                    setSimulating(true);
                    const response = await simulateShow({
                        location_city,
                        location_uf,
                        base_price,
                        client_type,
                        transport_type,
                        flights_count,
                        days_hotel
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
    }, [watchFields[0], watchFields[1], watchFields[2], watchFields[3], watchFields[4], watchFields[5], watchFields[6]]);

    async function onSubmit(data: any) {
        try {
            setLoading(true);

            // Filtra os dados granulares para não poluir o create principal caso a API recuse
            const { transport_type, flights_count, days_hotel, ...createData } = data;

            await createShow({
                ...createData,
                status: "SONDAGEM", // Todo show novo entra em sondagem
            });

            toast({
                title: "Show Criado!",
                description: "O novo evento foi adicionado à coluna de Sondagem.",
            });

            setOpen(false);
            form.reset();
            setSimulationResult(null);
            if (onShowCreated) onShowCreated();
        } catch (error: any) {
            toast({
                title: "Erro ao criar show",
                description: error.response?.data?.detail || "Ocorreu um erro inesperado.",
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
            <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] border-slate-200 bg-white shadow-2xl overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
                <div className="bg-indigo-600 p-8 text-white relative flex-shrink-0">
                    <Sparkles className="absolute top-4 right-4 h-12 w-12 text-white/10" />
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                            Registrar <span className="text-indigo-200">Novo Show</span>
                        </DialogTitle>
                    </DialogHeader>
                    <p className="text-xs font-bold text-indigo-100/80 italic mt-2 uppercase tracking-widest">
                        Alimentando o Pipeline Estratégico do Manager Show
                    </p>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Data do Evento</Label>
                            <Input
                                type="date"
                                {...form.register("date_show")}
                                className="rounded-xl border-slate-200 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tipo de Contratante</Label>
                            <Select
                                onValueChange={(v) => form.setValue("client_type", v as any)}
                                defaultValue={form.getValues("client_type")}
                            >
                                <SelectTrigger className="rounded-xl border-slate-200">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRIVATE">Privado (SaaS/Eventos)</SelectItem>
                                    <SelectItem value="PUBLIC">Governo (Prefeituras)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cidade</Label>
                            <Input
                                placeholder="Ex: Ribeirão Preto"
                                {...form.register("location_city")}
                                className="rounded-xl border-slate-200 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">UF</Label>
                            <Input
                                placeholder="SP"
                                maxLength={2}
                                {...form.register("location_uf")}
                                className="rounded-xl border-slate-200 focus:ring-indigo-500 uppercase"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Cachê Líquido (Receita)</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">R$</span>
                            <Input
                                type="number"
                                placeholder="0,00"
                                {...form.register("base_price")}
                                className="pl-10 rounded-xl border-slate-200 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <hr className="border-t border-slate-100 my-6" />

                    <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-800 mb-1">Simulador de Viabilidade Granular</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Métricas opcionais para previsão ProfitLight (Logística vs Preço)</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modalidade</Label>
                                <Select
                                    onValueChange={(v) => form.setValue("transport_type", v as any)}
                                    defaultValue={form.getValues("transport_type")}
                                >
                                    <SelectTrigger className="rounded-xl border-slate-200 bg-white shadow-sm">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AEREO">Aéreo (Avião)</SelectItem>
                                        <SelectItem value="VAN">Terrestre (Van/Bus)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Qtd. Passagens</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    {...form.register("flights_count")}
                                    className="rounded-xl border-slate-200 bg-white shadow-sm focus:ring-indigo-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Diárias (Hotel/Alim.)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    {...form.register("days_hotel")}
                                    className="rounded-xl border-slate-200 bg-white shadow-sm focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <ProfitLight
                        loading={simulating}
                        score={simulationResult?.score}
                        message={simulationResult?.message}
                    />

                    <div className="pt-4 flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-black active:scale-95"
                        >
                            {loading ? "Efetivando..." : "Salvar Negociação"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
