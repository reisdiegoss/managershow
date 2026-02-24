export default function AgendaPage() {
    const columns = [
        { title: "Sondagem", count: 3 },
        { title: "Proposta", count: 2 },
        { title: "Contrato Pendente", count: 1 },
        { title: "Assinado", count: 5 },
    ];

    return (
        <div class="flex h-full flex-col space-y-6">
            {/* Header da Página de Agenda */}
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
                        Agenda <span class="text-indigo-600">de Shows</span>
                    </h1>
                    <p class="text-sm text-slate-500 italic">Gerencie o fluxo de contratos e eventos em tempo real.</p>
                </div>

                <div class="flex items-center gap-2 rounded-xl bg-slate-200/50 p-1">
                    <button class="rounded-lg bg-white px-4 py-1.5 text-xs font-bold text-indigo-600 shadow-sm">Kanban</button>
                    <button class="rounded-lg px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600">Calendário</button>
                </div>
            </div>

            {/* Grid do Kanban */}
            <div class="flex-1 overflow-x-auto pb-4">
                <div class="flex h-full min-w-[1000px] gap-6">
                    {columns.map((col) => (
                        <div key={col.title} class="flex w-72 flex-col rounded-3xl bg-slate-100/50 p-4 border border-slate-200/60">
                            <div class="mb-4 flex items-center justify-between px-2">
                                <h3 class="text-sm font-black italic uppercase tracking-widest text-slate-700">{col.title}</h3>
                                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 shadow-inner">
                                    {col.count}
                                </span>
                            </div>

                            <div class="flex-1 space-y-4 overflow-y-auto custom-scrollbar">
                                {/* Placeholder para Cards */}
                                <div class="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center transition-colors hover:border-indigo-300 group cursor-pointer">
                                    <p class="text-xs font-bold text-slate-400 group-hover:text-indigo-500 uppercase tracking-tighter italic">+ Novo Card</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
