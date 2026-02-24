'use client';

import React, { useState, useEffect } from 'react';
import { useApi } from '@/lib/api';
import { DocumentTemplate, DocumentEntityType } from '@/types/document';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit2, Trash2, FileText, Info, Code } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

export default function TemplatesPage() {
    const { api } = useApi();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<DocumentTemplate> | null>(null);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/client/documents/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os templates.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTemplate?.id) {
                await api.put(`/client/documents/templates/${editingTemplate.id}`, editingTemplate);
                toast({ title: 'Sucesso', description: 'Template atualizado com sucesso.' });
            } else {
                await api.post('/client/documents/templates', editingTemplate);
                toast({ title: 'Sucesso', description: 'Template criado com sucesso.' });
            }
            setIsModalOpen(false);
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error) {
            console.error('Erro ao salvar template:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível salvar o template.',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Deseja realmente excluir este template?')) return;
        try {
            await api.delete(`/client/documents/templates/${id}`);
            toast({ title: 'Sucesso', description: 'Template excluído.' });
            fetchTemplates();
        } catch (error) {
            toast({ title: 'Erro', description: 'Erro ao excluir template.', variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="text-blue-600" />
                        Motor de Documentos
                    </h1>
                    <p className="text-slate-500 mt-1">Crie e gerencie templates dinâmicos para contratos e propostas.</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingTemplate({ entity_type: 'SHOW', content_html: '' })} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 gap-2">
                            <Plus size={18} /> Novo Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
                        <DialogHeader>
                            <DialogTitle>{editingTemplate?.id ? 'Editar Template' : 'Novo Template'}</DialogTitle>
                            <DialogDescription>
                                Compile templates corporativos usando HTML e variáveis dinâmicas.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveTemplate} className="space-y-6 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nome do Template</Label>
                                    <Input
                                        placeholder="Ex: Proposta Comercial Prefeitura"
                                        value={editingTemplate?.name || ''}
                                        onChange={(e) => setEditingTemplate({ ...editingTemplate!, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Entidade de Contexto</Label>
                                    <Select
                                        value={editingTemplate?.entity_type}
                                        onValueChange={(v: DocumentEntityType) => setEditingTemplate({ ...editingTemplate!, entity_type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SHOW">Show / Evento</SelectItem>
                                            <SelectItem value="ARTIST">Artista</SelectItem>
                                            <SelectItem value="CONTRACTOR">Contratante</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Code size={16} /> Conteúdo HTML (Jinja2)
                                    </Label>
                                    <Textarea
                                        className="font-mono text-sm min-h-[400px] bg-slate-50 border-slate-200"
                                        placeholder="<h1>Contrato</h1><p>O artista {{ show.artist.name }} se apresentará em {{ show.location_city }}.</p>"
                                        value={editingTemplate?.content_html || ''}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingTemplate({ ...editingTemplate!, content_html: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <Card className="rounded-2xl border-blue-50 bg-blue-50/30">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                <Info size={16} className="text-blue-600" />
                                                Dicas de Variáveis
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-xs space-y-3 text-slate-600">
                                            <p>Use chaves duplas para injetar dados do banco:</p>
                                            <ul className="space-y-1 font-mono text-[10px] bg-white/60 p-2 rounded-lg">
                                                <li>{"{{ show.artist.name }}"}</li>
                                                <li>{"{{ show.location_city }}"}</li>
                                                <li>{"{{ show.base_price }}"}</li>
                                                <li>{"{{ generated_at }}"}</li>
                                            </ul>
                                            <p className="mt-2 text-slate-500 italic">Você também pode definir variáveis customizadas no momento da geração.</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl">
                                    Salvar Template
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow>
                            <TableHead>Nome do Template</TableHead>
                            <TableHead>Entidade</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10">Carregando...</TableCell></TableRow>
                        ) : templates.length === 0 ? (
                            <TableRow><TableCell colSpan={4} className="text-center py-10 text-slate-400">Nenhum template cadastrado.</TableCell></TableRow>
                        ) : templates.map((tpl) => (
                            <TableRow key={tpl.id} className="hover:bg-slate-50/50 transition-colors">
                                <TableCell className="font-medium text-slate-700">{tpl.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="rounded-lg bg-slate-100 text-slate-600 border-none px-3 py-1">
                                        {tpl.entity_type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-500 text-sm">
                                    {new Date(tpl.created_at).toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingTemplate(tpl); setIsModalOpen(true); }} className="hover:bg-blue-50 hover:text-blue-600 rounded-lg">
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(tpl.id)} className="hover:bg-red-50 hover:text-red-600 rounded-lg">
                                        <Trash2 size={16} />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
