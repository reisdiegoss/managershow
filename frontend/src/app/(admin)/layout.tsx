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
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
    { label: 'Visão Global', icon: LayoutDashboard, href: '/admin' },
    { label: 'Produtoras (Tenants)', icon: Building2, href: '/admin/tenants' },
    { label: 'Suporte Técnico', icon: LifeBuoy, href: '/admin/tickets' },
    { label: 'Configuração WhatsApp', icon: MessageSquare, href: '/admin/configuracoes/whatsapp' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-transparent admin-theme text-slate-200">

            {/* Admin Sidebar */}
            <aside className="w-64 flex flex-col border-r border-white/5 glass-card shadow-2xl z-20">
                {/* Admin Header */}
                <div className="flex items-center gap-3 border-b border-white/5 p-6 bg-emerald-500/5">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
                        <ShieldCheck className="h-6 w-6 text-slate-950" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black italic uppercase tracking-tight text-white leading-none">
                            Super <span className="text-emerald-400">Admin</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Manager Show</span>
                    </div>
                </div>

                {/* Admin Navigation */}
                <nav className="flex-1 space-y-2 px-4 py-8">
                    <p className="px-4 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-600 mb-4">Administração SaaS</p>
                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3.5 transition-all duration-300 group",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5"
                                        : "text-slate-500 hover:bg-slate-900 hover:text-white"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5", isActive ? "text-emerald-500" : "group-hover:text-emerald-400")} />
                                <span className="text-[10px] font-black tracking-widest uppercase italic">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Admin Footer */}
                <div className="p-4 border-t border-white/5 bg-white/5">

                    <Link
                        href="/"
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-slate-400 hover:bg-slate-900 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest"
                    >
                        <LogOut size={16} /> Voltar ao App
                    </Link>
                    <div className="mt-4 p-2 rounded-xl glass-morphism border border-white/5">

                        <UserButton afterSignOutUrl="/sign-in" showName />
                    </div>
                </div>
            </aside>

            {/* Admin Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 glass-morphism z-10">

                    <div>
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-100">
                            Painel de <span className="text-emerald-500">Controle</span>
                        </h2>

                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acesso de Gestão Centralizada</p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end border-r pr-6 border-slate-100">
                            <span className="text-[10px] font-black uppercase text-slate-400">Ambiente</span>
                            <span className="text-[11px] font-black uppercase text-emerald-600 italic">Produção Segura</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full px-4">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-600 uppercase italic">SaaS Online</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-10">

                    {children}
                </div>
            </main>
        </div>
    );
}
