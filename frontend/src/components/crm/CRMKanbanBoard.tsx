'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useClientApi } from '@/lib/api/useClientApi';
import { CommercialLead, CommercialLeadStatus } from '@/types/crm';
import { CRMColumn } from './CRMColumn';
import { CRMLeadCard } from './CRMLeadCard';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { NewLeadModal } from './NewLeadModal';

const CRM_COLUMNS: { label: string; status: CommercialLeadStatus }[] = [
    { label: 'Prospecção', status: 'PROSPECÇÃO' },
    { label: 'Contato', status: 'CONTATO' },
    { label: 'Negociação', status: 'NEGOCIAÇÃO' },
    { label: 'Ganho', status: 'GANHO' },
    { label: 'Perdido', status: 'PERDIDO' },
];

export function CRMKanbanBoard() {
    const { api, updateLeadStatus } = useClientApi();
    const { toast } = useToast();
    const [leads, setLeads] = useState<CommercialLead[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const response = await api.get('/client/leads');
            setLeads(response.data);
        } catch (error) {
            console.error('Erro ao carregar leads:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar o pipeline de CRM.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const groupedLeads = useMemo(() => {
        return leads.reduce((acc: Record<string, CommercialLead[]>, lead: CommercialLead) => {
            if (!acc[lead.status]) {
                acc[lead.status] = [];
            }
            acc[lead.status].push(lead);
            return acc;
        }, {} as Record<string, CommercialLead[]>);
    }, [leads]);

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;

        const leadId = active.id as string;
        const overId = over.id as string;

        const activeLead = leads.find(l => l.id === leadId);
        if (!activeLead) return;

        const overLead = leads.find(l => l.id === overId);
        const newStatus = (overLead ? overLead.status : overId) as CommercialLeadStatus;

        if (activeLead.status === newStatus) return;

        // Optimistic Update
        const previousLeads = [...leads];
        setLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, status: newStatus } : l
        ));

        try {
            await updateLeadStatus(leadId, newStatus);

            if (newStatus === 'GANHO') {
                toast({
                    title: 'Oportunidade Ganha! 🎉',
                    description: 'Mova para a agenda para consolidar o show.',
                });
            }
        } catch (error) {
            setLeads(previousLeads);
            toast({
                title: 'Erro ao atualizar',
                description: 'Não foi possível mover o lead.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 w-full flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Carregando funil de vendas...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                        Pipeline de <span className="text-primary">Vendas</span>
                    </h1>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                        Sondagens e prospecções em andamento
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-primary hover:bg-primary/90 font-bold shadow-sm text-primary-foreground">
                    <Plus className="mr-2 h-5 w-5" /> Nova Sondagem
                </Button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-x-auto pb-6 custom-scrollbar">
                    <div className="flex h-full gap-6 px-1 min-w-[1400px]">
                        {CRM_COLUMNS.map((col) => {
                            const columnLeads = groupedLeads[col.status] || [];
                            return (
                                <SortableContext
                                    key={col.status}
                                    items={columnLeads.map(l => l.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <CRMColumn id={col.status} label={col.label} count={columnLeads.length}>
                                        {columnLeads.map((lead) => (
                                            <CRMLeadCard key={lead.id} lead={lead} />
                                        ))}
                                    </CRMColumn>
                                </SortableContext>
                            );
                        })}
                    </div>
                </div>
            </DndContext>

            <NewLeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchLeads}
            />
        </div>
    );
}
