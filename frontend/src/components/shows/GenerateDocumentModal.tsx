'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Download, Loader2 } from 'lucide-react';
import { useApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { DocumentTemplate } from '@/types/document';

interface GenerateDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: DocumentTemplate | null;
    entityId: string;
}

export function GenerateDocumentModal({ isOpen, onClose, template, entityId }: GenerateDocumentModalProps) {
    const { api } = useApi();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [variables, setVariables] = useState<{ key: string; value: string }[]>([]);

    const addVariable = () => {
        setVariables([...variables, { key: '', value: '' }]);
    };

    const removeVariable = (index: number) => {
        setVariables(variables.filter((_, i) => i !== index));
    };

    const updateVariable = (index: number, field: 'key' | 'value', value: string) => {
        const newVars = [...variables];
        newVars[index][field] = value;
        setVariables(newVars);
    };

    const handleGenerate = async () => {
        if (!template) return;

        try {
            setLoading(true);
            const custom_variables = variables.reduce((acc, curr) => {
                if (curr.key.trim()) acc[curr.key.trim()] = curr.value;
                return acc;
            }, {} as Record<string, string>);

            const response = await api.post(
                `/client/documents/templates/${template.id}/generate`,
                { entity_id: entityId, custom_variables },
                { responseType: 'blob' }
            );

            // Download do PDF
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${template.name.replace(/\s+/g, '_')}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast({
                title: 'Sucesso',
                description: 'Documento gerado e baixado com sucesso.',
            });
            onClose();
        } catch (error) {
            console.error('Erro ao gerar documento:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível gerar o documento.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle>Gerar {template?.name}</DialogTitle>
                    <DialogDescription>
                        Deseja adicionar variáveis extras para este documento? (Ex: nome_prefeito, cargo)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Variáveis Customizadas</Label>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={addVariable}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 gap-1"
                        >
                            <Plus size={14} /> Adicionar
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {variables.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4 italic">Nenhuma variável extra adicionada.</p>
                        ) : variables.map((variable, index) => (
                            <div key={index} className="flex gap-2 items-start">
                                <Input
                                    placeholder="Chave (ex: cargo)"
                                    value={variable.key}
                                    onChange={(e) => updateVariable(index, 'key', e.target.value)}
                                    className="flex-1"
                                />
                                <Input
                                    placeholder="Valor"
                                    value={variable.value}
                                    onChange={(e) => updateVariable(index, 'value', e.target.value)}
                                    className="flex-1"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeVariable(index)}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="rounded-xl">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 rounded-xl gap-2 font-bold px-6"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={18} />}
                        Gerar e Baixar PDF
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
