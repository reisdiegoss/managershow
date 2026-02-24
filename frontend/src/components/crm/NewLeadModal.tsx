'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useApi } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const leadSchema = z.object({
    contractor_name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
    city: z.string().min(2, 'A cidade é obrigatória'),
    target_date: z.string().optional(),
    estimated_budget: z.any().optional().transform(v => {
        if (!v) return undefined;
        const parsed = parseFloat(v);
        return isNaN(parsed) ? undefined : parsed;
    }),
    notes: z.string().optional(),
    seller_id: z.string().optional(),
});

type LeadFormValues = {
    contractor_name: string;
    city: string;
    target_date?: string;
    estimated_budget?: string | number;
    notes?: string;
    seller_id?: string;
};

interface NewLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewLeadModal({ isOpen, onClose, onSuccess }: NewLeadModalProps) {
    const { api } = useApi();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [sellers, setSellers] = useState<{ id: string; name: string }[]>([]);

    const form = useForm<LeadFormValues>({
        resolver: zodResolver(leadSchema),
        defaultValues: {
            contractor_name: '',
            city: '',
            target_date: '',
            notes: '',
            estimated_budget: '',
        },
    });

    // Carrega vendedores para o select
    useEffect(() => {
        if (isOpen) {
            api.get('/client/sellers')
                .then(res => setSellers(res.data))
                .catch(err => console.error('Erro ao carregar vendedores', err));
        }
    }, [isOpen, api]);

    const onSubmit = async (data: LeadFormValues) => {
        try {
            setLoading(true);
            await api.post('/client/leads', data);

            toast({
                title: 'Lead criado!',
                description: 'A nova sondagem foi adicionada ao pipeline com sucesso.',
            });

            form.reset();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erro ao criar lead:', error);
            toast({
                title: 'Erro ao criar lead',
                description: 'Verifique os dados e tente novamente.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Nova Sondagem</DialogTitle>
                    <DialogDescription>
                        Registre um novo lead para prospecção comercial.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <FormField
                            control={form.control}
                            name="contractor_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Contratante</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Prefeitura de... ou Empresa X" {...field} className="rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cidade</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Cidade - UF" {...field} className="rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="target_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Data Alvo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Junho/2026" {...field} className="rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="estimated_budget"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Orçamento Previsto (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0.00" {...field} value={field.value || ''} onChange={e => field.onChange(e.target.value)} className="rounded-xl" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="seller_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vendedor Responsável</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl">
                                                {sellers.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notas Iniciais</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detalhes da conversa..." {...field} className="rounded-xl min-h-[100px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl h-12">
                                {loading ? <Loader2 className="animate-spin" /> : 'Criar Sondagem'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
