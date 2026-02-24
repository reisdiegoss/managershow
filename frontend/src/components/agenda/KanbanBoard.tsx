"use client";

import { useEffect, useState, useMemo } from "react";
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    DragOverEvent
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";

import { useApi } from "@/lib/api";
import { Show, ShowStatus } from "@/types/show";
import { DroppableColumn } from "./DroppableColumn";
import { SortableShowCard } from "./SortableShowCard";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/**
 * Definição das colunas do Kanban baseadas nos status do backend.
 */
const COLUMNS: { label: string; status: ShowStatus }[] = [
    { label: "Sondagem", status: "SONDAGEM" },
    { label: "Proposta", status: "PROPOSTA" },
    { label: "Contrato Pendente", status: "CONTRATO_PENDENTE" },
    { label: "Assinado", status: "ASSINADO" },
];

/**
 * Componente KanbanBoard - O coração da Agenda.
 * Gerencia o fetch de dados, agrupamento e exibição das raias.
 */
export function KanbanBoard() {
    const { api, updateShowStatus } = useApi();
    const { toast } = useToast();
    const [shows, setShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Configuração dos sensores para desktop e touch (mobile)
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Previne arraste acidental ao clicar
            },
        })
    );

    /**
     * Busca os shows do backend ao montar o componente.
     */
    useEffect(() => {
        async function fetchShows() {
            try {
                setLoading(true);
                const response = await api.get("/client/shows");
                setShows(response.data);
                setError(null);
            } catch (err: any) {
                console.error("Erro ao carregar shows:", err);
                setError("Não foi possível carregar a agenda. Tente novamente mais tarde.");
            } finally {
                setLoading(false);
            }
        }

        fetchShows();
    }, [api]);

    /**
     * Agrupa os shows por status.
     */
    const groupedShows = useMemo(() => {
        return shows.reduce((acc: Record<string, Show[]>, show: Show) => {
            if (!acc[show.status]) {
                acc[show.status] = [];
            }
            acc[show.status].push(show);
            return acc;
        }, {} as Record<string, Show[]>);
    }, [shows]);

    /**
     * Lógica de Finalização do Arraste (Mutação e Optimistic UI)
     */
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const showId = active.id as string;
        const overId = over.id as string;

        // Localizar o show que está sendo arrastado
        const activeShow = shows.find(s => s.id === showId);
        if (!activeShow) return;

        // Determinar o novo status
        // Se soltou sobre uma coluna (ID da coluna é o status)
        // Se soltou sobre outro card (pegar status do card de destino)
        const overShow = shows.find(s => s.id === overId);
        const newStatus = (overShow ? overShow.status : overId) as ShowStatus;

        // Se o status não mudou, não faz nada
        if (activeShow.status === newStatus) return;

        // --- OPTIMISTIC UPDATE ---
        const previousShows = [...shows];

        // Atualiza o estado local imediatamente
        setShows(prev => prev.map(s =>
            s.id === showId ? { ...s, status: newStatus } : s
        ));

        toast({
            title: "Atualizando status...",
            description: `Movendo show para ${newStatus.replace('_', ' ')}`,
        });

        try {
            // Chamada para o backend
            await updateShowStatus(showId, newStatus);

            toast({
                title: "Sucesso!",
                description: "Status do show atualizado com sucesso.",
                variant: "default",
            });
        } catch (err: any) {
            console.error("Erro na mutação:", err);

            // --- ROLLBACK ---
            setShows(previousShows);

            const errorMessage = err.response?.data?.detail || "Erro ao conectar com o servidor.";

            toast({
                title: "Erro na atualização",
                description: `Não foi possível mudar o status: ${errorMessage}`,
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-sm font-medium text-slate-500 italic">Sincronizando com o Backend Gold Master...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-rose-50 p-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <p className="max-w-xs text-sm font-bold text-slate-800">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs font-bold text-indigo-600 underline uppercase tracking-tighter"
                >
                    Recarregar
                </button>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
        >
            <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
                <div className="flex h-full min-w-[1000px] gap-6 px-1">
                    {COLUMNS.map((col) => {
                        const columnShows = groupedShows[col.status] || [];

                        return (
                            <SortableContext
                                key={col.status}
                                items={columnShows.map(s => s.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <DroppableColumn
                                    id={col.status}
                                    label={col.label}
                                    count={columnShows.length}
                                >
                                    {columnShows.map((show) => (
                                        <SortableShowCard key={show.id} show={show} />
                                    ))}

                                    {/* Botão de Adição Rápida */}
                                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-6 transition-all hover:border-indigo-300 hover:bg-white group">
                                        <Plus className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-indigo-500 italic">
                                            Novo Show
                                        </span>
                                    </button>
                                </DroppableColumn>
                            </SortableContext>
                        );
                    })}
                </div>
            </div>
        </DndContext>
    );
}
