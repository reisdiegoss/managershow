'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CommercialLead } from '@/types/crm';
import { Card } from '@/components/ui/card';
import { MapPin, DollarSign, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CRMLeadCardProps {
    lead: CommercialLead;
}

export function CRMLeadCard({ lead }: CRMLeadCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lead.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                "group cursor-grab active:cursor-grabbing",
                isDragging && "opacity-50"
            )}
        >
            <Card className="p-4 rounded-3xl border-slate-100 shadow-sm hover:shadow-md transition-all hover:border-blue-200 bg-white">
                <div className="space-y-3">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-sm leading-tight uppercase italic">{lead.contractor_name}</h4>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <MapPin size={10} className="text-blue-500" />
                            {lead.city}
                        </div>

                        {lead.target_date && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                <Calendar size={10} className="text-blue-500" />
                                {lead.target_date}
                            </div>
                        )}

                        {lead.estimated_budget !== undefined && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-tighter bg-blue-50 w-fit px-2 py-0.5 rounded-lg">
                                <DollarSign size={10} />
                                R$ {lead.estimated_budget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        )}

                        {lead.seller && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 border-t border-slate-50 pt-2 mt-2">
                                <User size={10} className="text-slate-300" />
                                <span className="italic">{lead.seller.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
