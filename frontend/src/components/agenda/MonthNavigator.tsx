"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthNavigatorProps {
    date: Date;
    onChange: (newDate: Date) => void;
}

/**
 * MonthNavigator - Seletor de período para filtrar o Kanban.
 */
export function MonthNavigator({ date, onChange }: MonthNavigatorProps) {
    const nextMonth = () => onChange(addMonths(date, 1));
    const prevMonth = () => onChange(subMonths(date, 1));

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-2xl bg-white border border-slate-200 p-1 shadow-sm">
                <button
                    onClick={prevMonth}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2 px-4 min-w-[150px] justify-center">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-xs font-black uppercase tracking-tighter text-slate-700 italic">
                        {format(date, "MMMM yyyy", { locale: ptBR })}
                    </span>
                </div>

                <button
                    onClick={nextMonth}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <button
                onClick={() => onChange(new Date())}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all border-b border-transparent hover:border-indigo-600"
            >
                Hoje
            </button>
        </div>
    );
}
