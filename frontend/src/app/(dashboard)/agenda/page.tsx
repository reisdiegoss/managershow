"use client";

import { useState } from "react";
import { KanbanBoard } from "@/components/agenda/KanbanBoard";
import { MonthNavigator } from "@/components/agenda/MonthNavigator";
import { NewShowDialog } from "@/components/agenda/NewShowDialog";

/**
 * Página de Agenda - Dashboard Principal de Shows.
 * Gerencia o estado global de período (mês/ano) e criação de novos shows.
 */
export default function AgendaPage() {
    const [currentDate, setCurrentDate] = useState(new Date());

    return (
        <div className="flex h-full flex-col space-y-8">
            {/* Header da Página */}
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                        Agenda <span className="text-indigo-600">Global</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 italic">
                        Visualização estratégica do pipeline de vendas e contratos.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Navegador Temporal (Mês/Ano) */}
                    <MonthNavigator date={currentDate} onChange={setCurrentDate} />

                    {/* Botão de Ação Principal (Modal com Simulador) */}
                    <NewShowDialog onShowCreated={() => window.location.reload()} />
                </div>
            </div>

            <div className="flex items-center justify-between">
                {/* Switcher Visual */}
                <div className="flex w-fit items-center gap-1 rounded-2xl bg-slate-200/50 p-1.5 shadow-inner">
                    <button className="rounded-xl bg-white px-5 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-md transition-all">
                        Kanban
                    </button>
                    <button className="rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-all">
                        Calendário
                    </button>
                </div>

                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Filtrando por: <span className="text-slate-800">{currentDate.getMonth() + 1}/{currentDate.getFullYear()}</span>
                </div>
            </div>

            {/* Quadro Kanban Integrado com Estado de Data */}
            <KanbanBoard currentDate={currentDate} />
        </div>
    );
}
