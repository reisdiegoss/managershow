'use client';

import React from 'react';
import {
    Settings,
    MessageSquare,
    Database,
    Cloud,
    Terminal,
    ShieldCheck,
    Smartphone,
    Server
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettingsPage() {
    const sections = [
        {
            title: 'Comunicação & Mensageria',
            description: 'Gestão da Evolution API e instâncias de WhatsApp.',
            icon: MessageSquare,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            status: 'Operacional',
            action: 'Configurar'
        },
        {
            title: 'Infraestrutura AWS',
            description: 'Bucket S3, CloudFront e armazenamento de mídia.',
            icon: Cloud,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            status: 'Conectado',
            action: 'Gerenciar'
        },
        {
            title: 'Base de Dados',
            description: 'Backups PostgreSQL e integridade de dados.',
            icon: Database,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            status: 'Otimizado',
            action: 'Auditar'
        },
        {
            title: 'Segurança & Logs',
            description: 'Auditoria de acessos e God Mode (Impersonation).',
            icon: ShieldCheck,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            status: 'Monitorando',
            action: 'Ver Logs'
        }
    ];

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                    Configurações <span className="text-emerald-500">Globais</span>
                </h1>
                <p className="text-sm font-medium text-muted-foreground">Gestão centralizada da infraestrutura e integrações</p>
            </div>

            {/* Grid de Seções */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {sections.map((section, idx) => (
                    <div
                        key={idx}
                        className="group relative overflow-hidden rounded-3xl border border-border bg-card/40 backdrop-blur-2xl p-8 hover:border-emerald-500/30 transition-all duration-300 shadow-sm"
                    >
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-start justify-between mb-8">
                                <div className={cn("p-4 rounded-xl", section.bg)}>
                                    <section.icon className={cn("w-6 h-6", section.color)} />
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-emerald-500">{section.status}</span>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-2">{section.title}</h3>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-8">
                                {section.description}
                            </p>

                            <button className="mt-auto w-full py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 text-sm font-semibold text-emerald-500 transition-all duration-300">
                                {section.action}
                            </button>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-[60px] group-hover:opacity-100 opacity-20 transition-opacity" />
                    </div>
                ))}
            </div>

            {/* Advanced System Status */}
            <div className="rounded-3xl border border-border bg-card/40 backdrop-blur-xl p-8 shadow-sm">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Terminal className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground mb-1">System Environment</h3>
                        <p className="text-xs font-medium text-muted-foreground">Core Engine: v0.6.0 (Stabilized)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Runtime Environment</span>
                        <span className="text-sm font-semibold text-foreground">Linux (FastAPI Container)</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-muted/50 border border-emerald-500/20 flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Frontend Architecture</span>
                        <span className="text-sm font-semibold text-emerald-500">Client-Side SPA Strict</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Static Assets</span>
                        <span className="text-sm font-semibold text-foreground">AWS S3 (Region: us-east-1)</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
