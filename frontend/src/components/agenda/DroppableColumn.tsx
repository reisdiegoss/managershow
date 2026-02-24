"use client";

import { useDroppable } from "@dnd-kit/core";
import { ShowStatus } from "@/types/show";
import { cn } from "@/lib/utils";

interface DroppableColumnProps {
    id: ShowStatus;
    label: string;
    count: number;
    children: React.ReactNode;
}

/**
 * DroppableColumn - Representa uma raia no Kanban que pode receber cards.
 */
export function DroppableColumn({ id, label, count, children }: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex w-[280px] flex-col rounded-[2rem] p-3 border transition-colors",
                isOver
                    ? "bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-100 ring-inset"
                    : "bg-slate-100/40 border-slate-200/50"
            )}
        >
            {/* Header da Coluna */}
            <div className="mb-4 flex items-center justify-between px-3 pt-2">
                <h3 className="text-[11px] font-black italic uppercase tracking-[0.2em] text-slate-500">
                    {label}
                </h3>
                <span className="flex h-5 w-8 items-center justify-center rounded-full bg-slate-200/60 text-[10px] font-black text-slate-600">
                    {count}
                </span>
            </div>

            {/* Lista de Cards */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {children}
            </div>
        </div>
    );
}
