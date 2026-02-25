'use client';

import React from 'react';
import { useForm, Controller, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { UploadCloud, Info } from 'lucide-react';

export interface DynamicField {
    id: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'boolean' | 'file';
    required?: boolean;
    options?: string[];
    placeholder?: string;
}

interface DynamicFormRendererProps {
    fields: DynamicField[];
    onSubmit: (data: any) => void;
    submitLabel?: string;
}

export function DynamicFormRenderer({ fields, onSubmit, submitLabel = "Salvar Dados" }: DynamicFormRendererProps) {
    const schemaShape: any = {};
    fields.forEach(field => {
        let fieldSchema: any = z.any();
        if (field.type === 'text') fieldSchema = z.string();
        if (field.type === 'number') fieldSchema = z.number();
        if (field.type === 'boolean') fieldSchema = z.boolean();

        if (field.required) {
            fieldSchema = fieldSchema.min(1, { message: "Campo obrigatório" });
        } else {
            fieldSchema = fieldSchema.optional();
        }
        schemaShape[field.id] = fieldSchema;
    });

    const dynamicSchema = z.object(schemaShape);
    const { control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(dynamicSchema),
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                {fields.map((field) => (
                    <div key={field.id} className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </Label>

                        <Controller
                            name={field.id}
                            control={control}
                            render={({ field: { onChange, value } }) => {
                                if (field.type === 'text') {
                                    return <Input
                                        placeholder={field.placeholder}
                                        onChange={onChange}
                                        value={(value as string) || ''}
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-sm"
                                    />;
                                }
                                if (field.type === 'select') {
                                    return (
                                        <Select onValueChange={onChange} value={(value as string) || ''}>
                                            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-sm">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-slate-100">
                                                {field.options?.map(opt => (
                                                    <SelectItem key={opt} value={opt} className="text-xs font-bold uppercase italic">
                                                        {opt}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    );
                                }
                                if (field.type === 'boolean') {
                                    return (
                                        <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight italic">Confirmar item?</span>
                                            <Switch checked={!!value} onCheckedChange={onChange} />
                                        </div>
                                    );
                                }
                                if (field.type === 'file') {
                                    const file = value as File | undefined;
                                    return (
                                        <div className="relative group cursor-pointer">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => onChange(e.target.files?.[0])}
                                            />
                                            <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 bg-slate-50/50 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all">
                                                <UploadCloud className="text-slate-300 group-hover:text-emerald-500" size={24} />
                                                <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-emerald-600 tracking-widest">
                                                    {file ? file.name : "Clique para anexar arquivo"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                if (field.type === 'number') {
                                    return <Input
                                        type="number"
                                        inputMode="decimal"
                                        step="0.01"
                                        placeholder={field.placeholder}
                                        onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                        value={value || ''}
                                        className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all text-sm"
                                    />;
                                }
                            }}
                        />
                        {errors[field.id] && (
                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight italic ml-1">
                                {String(errors[field.id]?.message) || "Inválido"}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic shadow-lg shadow-emerald-500/20 transition-all mt-4">
                {submitLabel}
            </Button>

            <div className="flex items-center gap-2 justify-center opacity-40">
                <Info size={12} />
                <span className="text-[8px] font-bold uppercase tracking-widest italic">Formulário Dinâmico SaaS</span>
            </div>
        </form>
    );
}
