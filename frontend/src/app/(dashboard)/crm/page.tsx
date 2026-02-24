'use client';

import React from 'react';
import { CRMKanbanBoard } from '@/components/crm/CRMKanbanBoard';

export default function CRMPage() {
    return (
        <div className="flex flex-col h-full bg-slate-50/50 -m-8 p-8 min-h-[calc(100vh-64px)]">
            <CRMKanbanBoard />
        </div>
    );
}
