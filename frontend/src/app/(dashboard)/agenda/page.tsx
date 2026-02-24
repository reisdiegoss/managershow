import { KanbanBoard } from "@/components/agenda/KanbanBoard";

/**
 * Página de Agenda - Dashboard Principal de Shows.
 * Server Component que encapsula o Client Component KanbanBoard.
 */
export default function AgendaPage() {
    return (
        <div className="flex h-full flex-col space-y-8">
            {/* Header da Página */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                        Agenda <span className="text-indigo-600">Global</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 italic">
                        Visualização estratégica do pipeline de vendas e contratos.
                    </p>
                </div>

                {/* Switcher Visual (Draft) */}
                <div className="flex w-fit items-center gap-1 rounded-2xl bg-slate-200/50 p-1.5 shadow-inner">
                    <button className="rounded-xl bg-white px-5 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-md transition-all">
                        Kanban
                    </button>
                    <button className="rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-400 transition-all">
                        Calendário
                    </button>
                </div>
            </div>

            {/* Quadro Kanban Integrado */}
            <KanbanBoard />
        </div>
    );
}
