'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
    LayoutDashboard,
    Building2,
    LifeBuoy,
    LogOut,
    MessageSquare,
    ShieldCheck,
    TrendingUp,
    Users,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const adminNavItems = [
    { label: 'Visão Global', icon: LayoutDashboard, href: '/admin' },
    { label: 'Clientes', icon: Building2, href: '/admin/tenants' },
    { label: 'Planos e Módulos', icon: CreditCard, href: '/admin/planos' },
    { label: 'Suporte Técnico', icon: LifeBuoy, href: '/admin/tickets' },
    { label: 'Configuração WhatsApp', icon: MessageSquare, href: '/admin/configuracoes/whatsapp' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">

            {/* Admin Sidebar */}
            <aside className="w-64 flex flex-col border-r border-border bg-card/30 backdrop-blur-xl z-20">
                {/* Admin Header */}
                <div className="flex items-center gap-3 border-b border-border/50 p-6 bg-primary/5">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                        <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black italic uppercase tracking-tight text-foreground leading-none">
                            Super <span className="text-primary">Admin</span>
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Manager Show</span>
                    </div>
                </div>

                {/* Admin Navigation */}
                <nav className="flex-1 space-y-2 px-4 py-8 overflow-y-auto custom-scrollbar">
                    <p className="px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-4">Administração SaaS</p>
                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-300 group",
                                    isActive
                                        ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "group-hover:text-primary")} />
                                <span className="text-[10px] font-black tracking-widest uppercase italic">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin Footer */}
                <div className="p-4 border-t border-border bg-card/50">

                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        <LogOut size={16} /> Voltar ao App
                    </Link>
                    <div className="mt-4 p-2 flex items-center justify-between rounded-xl glass-morphism border border-border/50 bg-background/50">
                        <UserButton afterSignOutUrl="/sign-in" showName />
                        <ThemeToggle />
                    </div>
                </div>
            </aside>

            {/* Admin Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 border-b border-border flex items-center justify-between px-10 bg-card/20 backdrop-blur-md z-10">

                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-foreground">
                            Painel de <span className="text-primary">Controle</span>
                        </h2>

                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acesso de Gestão Centralizada</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end border-r pr-6 border-border">
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Ambiente</span>
                            <span className="text-[11px] font-black uppercase text-primary italic">Produção Segura</span>
                        </div>
                        <div className="flex items-center gap-2 bg-primary/10 p-1.5 rounded-full px-4 border border-primary/20">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-black text-primary uppercase italic">SaaS Online</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10 bg-background">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {children}
                    </div>
                </div>
            </main>
        </div >
    );
}
