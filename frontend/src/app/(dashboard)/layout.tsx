"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import {
    CalendarDays,
    FileText,
    Route,
    Wallet,
    Users,
    FolderOpen,
    Home,
    AudioLines,
    Bell,
    LayoutDashboard,
    Mic2,
    Building2,
    MapPin,
    ChevronRight
} from "lucide-react";

/**
 * Itens de navegação principal
 */
const mainNavItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Agenda Comercial", icon: CalendarDays, href: "/agenda" },
    { label: "Logística", icon: Route, href: "/logistics" },
    { label: "Borderô Financeiro", icon: Wallet, href: "/finance" },
];

/**
 * Itens de Cadastros Base
 */
const cadastroItems = [
    { label: "Artistas", icon: Mic2, href: "/artistas" },
    { label: "Contratantes", icon: Building2, href: "/contratantes" },
    { label: "Locais (Venues)", icon: MapPin, href: "/locais" },
    { label: "Templates", icon: FileText, href: "/templates" },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-800">

            {/* 1. SIDEBAR (Desktop Only) */}
            <aside className="hidden w-64 flex-col bg-slate-900 text-white shadow-2xl md:flex">
                {/* Logo Premium */}
                <div className="flex items-center gap-3 border-b border-slate-800 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                        <AudioLines className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl font-black italic uppercase tracking-tight text-white">
                        Manager <span className="text-indigo-400">Show</span>
                    </span>
                </div>

                {/* Links de Navegação */}
                <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 scrollbar-hide">
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Principal</p>
                        {mainNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                                        ? "bg-slate-800/50 text-indigo-400 shadow-inner"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-[11px] font-black tracking-wide uppercase italic">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Cadastros Base</p>
                        {cadastroItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${isActive
                                        ? "bg-slate-800/50 text-indigo-400 shadow-inner"
                                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-[11px] font-black tracking-wide uppercase italic">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer Sidebar / Perfil */}
                <div className="border-t border-slate-800 bg-slate-950/20 p-4">
                    <div className="flex items-center justify-between rounded-xl bg-slate-800/30 p-2">
                        <UserButton afterSignOutUrl="/sign-in" showName />
                    </div>
                </div>
            </aside>

            {/* 2. MAIN CONTENT AREA */}
            <main className="relative flex flex-1 flex-col overflow-hidden">

                {/* Header Superior (Responsivo) */}
                <header className="flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
                    {/* Mobile Logo / Desktop Title */}
                    <div className="flex items-center gap-2">
                        <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold italic">M</div>
                        <h2 className="text-lg font-bold text-slate-800 md:block hidden">
                            {pathname === "/" ? "Dashboard Analítico" : pathname.replace("/", "").toUpperCase()}
                        </h2>
                        <span className="md:hidden font-black text-slate-900 italic tracking-tighter">MANAGER SHOW</span>
                    </div>

                    {/* Ações e Perfil */}
                    <div className="flex items-center gap-4">
                        <button className="hidden md:flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-indigo-700">
                            Novo Show
                        </button>
                        <div className="h-6 w-px bg-slate-200" />
                        <button className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100">
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-rose-500" />
                        </button>
                        <div className="md:hidden">
                            <UserButton afterSignOutUrl="/sign-in" />
                        </div>
                    </div>
                </header>

                {/* Área de Conteúdo Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 pb-24 md:p-8 md:pb-8">
                    {children}
                </div>

                {/* 3. BOTTOM NAVIGATION (Mobile Only) */}
                <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around border-t border-slate-200 bg-white/80 px-2 py-3 backdrop-blur-md md:hidden">
                    {[...mainNavItems.slice(0, 3), { label: "Perfil", icon: Users, href: "/profile" }].map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-indigo-600" : "text-slate-400"
                                    }`}
                            >
                                <div className={`flex h-10 w-16 items-center justify-center rounded-2xl transition-colors ${isActive ? "bg-indigo-50" : ""
                                    }`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </main>
        </div>
    );
}
