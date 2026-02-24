"use client";

import { useEffect, useState, useMemo } from "react";
import { useApi } from "@/lib/api";
import { Show, ShowStatus } from "@/types/show";
import { ShowCard } from "./ShowCard";
import { Loader2, Plus } from "lucide-react";

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
    const api = useApi();
    const [shows, setShows] = useState<Show[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Busca os shows do backend ao montar o componente.
     */
    useEffect(() => {
        async function fetchShows() {
            try {
                setLoading(true);
                // Endpoint do nosso backend FastAPI
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
     * Agrupa os shows por status para otimizar a renderização das colunas.
     */
    const groupedShows = useMemo(() => {
        return shows.reduce((acc, show) => {
            if (!acc[show.status]) {
                acc[show.status] = [];
            }
            acc[show.status].push(show);
            return acc;
        }, {} as Record<string, Show[]>);
    }, [shows]);

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
        <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
            <div className="flex h-full min-w-[1000px] gap-6 px-1">
                {COLUMNS.map((col) => {
                    const columnShows = groupedShows[col.status] || [];

                    return (
                        <div
                            key={col.status}
                            className="flex w-[280px] flex-col rounded-[2rem] bg-slate-100/40 p-3 border border-slate-200/50"
                        >
                            {/* Header da Coluna */}
                            <div className="mb-4 flex items-center justify-between px-3 pt-2">
                                <h3 className="text-[11px] font-black italic uppercase tracking-[0.2em] text-slate-500">
                                    {col.label}
                                </h3>
                                <span className="flex h-5 w-8 items-center justify-center rounded-full bg-slate-200/60 text-[10px] font-black text-slate-600">
                                    {columnShows.length}
                                </span>
                            </div>

                            {/* Lista de Cards */}
                            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                                {columnShows.map((show) => (
                                    <ShowCard key={show.id} show={show} />
                                ))}

                                {/* Botão de Adição Rápida */}
                                <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-6 transition-all hover:border-indigo-300 hover:bg-white group">
                                    <Plus className="h-4 w-4 text-slate-400 group-hover:text-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-indigo-500 italic">
                                        Novo Show
                                    </span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
