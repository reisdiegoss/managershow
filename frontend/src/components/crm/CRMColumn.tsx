'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface CRMColumnProps {
    id: string;
    label: string;
    count: number;
    children: React.ReactNode;
}

export function CRMColumn({ id, label, count, children }: CRMColumnProps) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col w-[280px] shrink-0 h-full">
            {/* Header da Coluna */}
            <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                        {label}
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                        {count}
                    </span>
                </div>
            </div>

            {/* Area de Drop */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 flex flex-col gap-3 p-2 rounded-[2rem] transition-colors min-h-[500px]",
                    isOver ? "bg-blue-50/50" : "bg-slate-50/30"
                )}
            >
                {children}
            </div>
        </div>
    );
}
