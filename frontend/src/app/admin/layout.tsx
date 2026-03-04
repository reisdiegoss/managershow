'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
    Building2,
    LifeBuoy,
    LogOut,
    ShieldCheck,
    CreditCard,
    Users,
    Settings,
    LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const adminNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Clientes', icon: Building2, href: '/admin/tenants' },
    { label: 'Planos SaaS', icon: CreditCard, href: '/admin/planos' },
    { label: 'CRM/Vendas', icon: Users, href: '/admin/crm' },
    { label: 'Tickets', icon: LifeBuoy, href: '/admin/tickets' },
    { label: 'Config.', icon: Settings, href: '/admin/configuracoes' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
            {/* Sidebar (Desktop Only) */}
            <aside className="hidden w-72 flex-col border-r border-border bg-card md:flex z-20 shadow-sm">
                {/* Brand / Logo */}
                <div className="flex items-center gap-3 border-b border-border p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/20">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-extrabold tracking-tight text-foreground">
                            Tower <span className="text-emerald-500">Control</span>
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Manager Show</span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                    <div className="px-4 mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nexus Network</span>
                    </div>

                    {adminNavItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200",
                                    isActive
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span className="text-sm">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Profile / Actions */}
                <div className="p-4 border-t border-border bg-muted/30">
                    <Link
                        href="/dashboard"
                        className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 mb-4 text-muted-foreground transition-all hover:bg-muted hover:text-foreground text-xs font-bold uppercase tracking-widest"
                    >
                        <LogOut size={16} /> Voltar ao App
                    </Link>

                    <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-background">
                        <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }} />
                        <ThemeToggle />
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="relative flex flex-1 flex-col overflow-hidden">
                {/* Header Superior (Responsivo) */}
                <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 z-10 transition-colors">
                    <div className="flex items-center gap-4">
                        {/* Mobile Logo */}
                        <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold shadow-sm">
                            T
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-bold text-foreground tracking-tight hidden md:block">
                                Portal <span className="text-emerald-500">Administrativo</span>
                            </h2>
                            <h2 className="text-lg font-bold text-foreground tracking-tight md:hidden">
                                Admin
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex flex-col items-end pr-4 border-r border-border">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Sincronização</span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Audit Mode</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
                        </div>
                        <div className="md:hidden flex items-center gap-3">
                            <ThemeToggle />
                            <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }} />
                        </div>
                    </div>
                </header>

                {/* Page Content Viewport */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 relative z-10 custom-scrollbar scroll-smooth">
                    <div className="max-w-7xl mx-auto min-h-full">
                        {children}
                    </div>
                </div>

                {/* Mobile Bottom Navigation Component */}
                <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around border-t border-border bg-background/95 px-2 py-3 backdrop-blur-xl md:hidden">
                    {/* Exibe apenas 5 items no máximo para não quebrar o layout no mobile */}
                    {adminNavItems.slice(0, 5).map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center gap-1 transition-all",
                                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                                )}
                            >
                                <div className={cn(
                                    "flex h-10 w-16 items-center justify-center rounded-xl transition-colors",
                                    isActive ? "bg-emerald-500/10" : ""
                                )}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-tight text-center leading-none">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </main>
        </div>
    );
}
