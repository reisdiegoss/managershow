'use client';

import React, { useState } from 'react';
import { ContractorNote } from '@/types/crm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, MessageSquarePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface ContractorNoteTimelineProps {
    contractorId: string;
    initialNotes: ContractorNote[];
}

export function ContractorNoteTimeline({ contractorId, initialNotes }: ContractorNoteTimelineProps) {
    const { addContractorNote } = useApi();
    const { toast } = useToast();
    const [notes, setNotes] = useState<ContractorNote[]>(initialNotes);
    const [newNote, setNewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddNote = async () => {
        if (!newNote.trim()) return;

        try {
            setIsSubmitting(true);
            const response = await addContractorNote(contractorId, newNote);
            setNotes([response.data, ...notes]);
            setNewNote('');
            toast({
                title: 'Nota adicionada!',
                description: 'O histórico comercial foi atualizado.',
            });
        } catch (error) {
            console.error('Erro ao adicionar nota:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar a nota.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Input de Nova Nota */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <MessageSquarePlus size={14} className="text-blue-500" />
                    Registrar Nova Interação
                </h4>
                <Textarea
                    placeholder="Resuma o contato, feedback ou observação importante..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="rounded-2xl border-slate-100 bg-slate-50 focus:bg-white min-h-[100px]"
                />
                <div className="flex justify-end">
                    <Button
                        onClick={handleAddNote}
                        disabled={isSubmitting || !newNote.trim()}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 px-6"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Salvar Nota'}
                    </Button>
                </div>
            </div>

            {/* Lista de Notas */}
            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:via-blue-100 before:to-transparent">
                {notes.map((note) => (
                    <div key={note.id} className="relative flex items-start gap-6 group">
                        {/* Dot */}
                        <div className="absolute left-0 mt-1.5 h-10 w-10 flex items-center justify-center rounded-full bg-white border-2 border-blue-500 shadow-sm z-10">
                            <User size={16} className="text-blue-600" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 ml-10 p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                    {format(new Date(note.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                {note.content}
                            </p>
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="ml-10 py-10 text-center">
                        <p className="text-sm font-bold text-slate-400 italic uppercase">Nenhuma nota registrada no histórico deste contratante.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
