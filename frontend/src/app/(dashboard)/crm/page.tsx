'use client';

import React from 'react';
import { CRMKanbanBoard } from '@/components/crm/CRMKanbanBoard';

export default function CRMPage() {
    return (
        <div className="flex flex-col h-full min-h-[calc(100vh-64px)] w-full">
            <CRMKanbanBoard />
        </div>
    );
}
