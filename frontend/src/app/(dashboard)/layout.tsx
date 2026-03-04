import React from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
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
    ChevronRight,
    Store,
    TrendingUp,
    Glasses
} from "lucide-react";
import { GlobalArtistSelector } from "@/components/layout/GlobalArtistSelector";
import { useToast } from "@/components/ui/use-toast";
import { useClientApi } from '@/lib/api/useClientApi';
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Itens de navegação principal
 */
const mainNavItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/" },
    { label: "Visão Consolidada", icon: TrendingUp, href: "/consolidada", minAccountType: 'AGENCY' },
    { label: "Agenda Comercial", icon: CalendarDays, href: "/agenda" },
    { label: "Pipeline CRM", icon: Building2, href: "/crm" },
    { label: "Logística", icon: Route, href: "/logistics" },
    { label: "Borderô Financeiro", icon: Wallet, href: "/finance" },
    { label: "Folha Global", icon: Wallet, href: "/folha-global", minAccountType: 'AGENCY' },
];

/**
 * Itens de Cadastros Base
 */
const cadastroItems = [
    { label: "Artistas", icon: Mic2, href: "/artistas" },
    { label: "Casting", icon: Glasses, href: "/casting", minAccountType: 'AGENCY' },
    { label: "Contratantes", icon: Building2, href: "/contratantes" },
    { label: "Locais (Venues)", icon: MapPin, href: "/locais" },
    { label: "Equipe", icon: Users, href: "/configuracoes/equipe", minAccountType: 'AGENCY' },
    { label: "Templates", icon: FileText, href: "/templates" },
    { label: "Admin & Planos", icon: Store, href: "/billing", color: 'text-emerald-500' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { toast } = useToast();
    const { theme } = useTheme();
    const { getMe } = useClientApi();
    const [tenant, setTenant] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await getMe();
                setTenant(res.data?.tenant);
            } catch (err) {
                console.error("Erro ao carregar contexto do tenant:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, [getMe]);

    const filterItems = (items: any[]) => {
        return items.filter(item => {
            if (!item.minAccountType) return true;
            return tenant?.account_type === item.minAccountType;
        });
    };

    const filteredMainNav = filterItems(mainNavItems);
    const filteredCadastro = filterItems(cadastroItems);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground transition-colors duration-300">
            {/* 1. SIDEBAR (Desktop Only) */}
            <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex z-20 shadow-sm">
                {/* Logo Premium */}
                <div className="flex items-center gap-3 border-b border-border p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                        <AudioLines className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tight text-foreground">
                        Manager <span className="text-primary">Show</span>
                    </span>
                </div>

                {/* Links de Navegação */}
                <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6 scrollbar-hide">
                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Principal</p>
                        {loading ? (
                            <div className="space-y-2 px-4">
                                <Skeleton className="h-10 w-full rounded-lg" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        ) : filteredMainNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 ${isActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="space-y-1">
                        <p className="px-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Cadastros Base</p>
                        {loading ? (
                            <div className="space-y-2 px-4">
                                <Skeleton className="h-10 w-full rounded-lg" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        ) : filteredCadastro.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all duration-200 ${isActive
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : theme === 'dark' ? "text-slate-400 hover:text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        } ${item.color || ''}`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer Sidebar / Perfil */}
                <div className="border-t border-border bg-muted/30 p-4">
                    <div className="flex items-center justify-between rounded-lg bg-background p-2 border border-border">
                        <UserButton afterSignOutUrl="/sign-in" showName />
                    </div>
                </div>
            </aside>

            {/* 2. MAIN CONTENT AREA */}
            <main className="relative flex flex-1 flex-col overflow-hidden">
                {/* Header Superior (Responsivo) */}
                <header className="flex h-16 w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6 z-10 transition-colors">
                    {/* Mobile Logo / Desktop Title */}
                    <div className="flex items-center gap-4">
                        <div className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">M</div>
                        <h2 className="text-lg font-bold text-foreground md:block hidden tracking-tight">
                            {pathname === "/" ? "Dashboard Analítico" : pathname.replace("/", "").toUpperCase()}
                        </h2>

                        {/* Seletor Global de Artista (Ocultação Inteligente) */}
                        <div className="hidden md:block">
                            <GlobalArtistSelector />
                        </div>
                    </div>

                    {/* Ações e Perfil */}
                    <div className="flex items-center gap-4">
                        <button className="hidden md:flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-all">
                            Novo Show
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted">
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-background bg-rose-500" />
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
                <nav className="fixed bottom-0 z-50 flex w-full items-center justify-around border-t border-border bg-background/90 px-2 py-3 backdrop-blur-xl md:hidden">
                    {filteredMainNav.slice(0, 4).map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-primary" : "text-muted-foreground"
                                    }`}
                            >
                                <div className={`flex h-10 w-16 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-primary/10" : ""
                                    }`}>
                                    <item.icon className="h-6 w-6" />
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-tight">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </main>
        </div>
    );
}
