import { Suspense } from "react";
import { Wallet, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export default function FinancePage() {
    return (
        <div className="flex h-full flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-primary" />
                        Borderô Financeiro
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">Controle de receitas, despesas (DRE) e fechamentos de cachês.</p>
                </div>
                <button className="px-6 py-2.5 rounded-xl text-primary-foreground font-bold text-sm bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                    Novo Lançamento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Saldo Líquido */}
                <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-foreground font-bold">
                        <Wallet className="h-5 w-5 text-primary" /> Saldos e Retenções
                    </div>
                    <div>
                        <span className="text-4xl font-extrabold tracking-tight text-foreground">R$ 0<span className="text-xl text-muted-foreground">,00</span></span>
                    </div>
                </div>

                {/* Receitas */}
                <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-emerald-600 dark:text-emerald-400 font-bold">
                        <TrendingUp className="h-5 w-5" /> Entradas / Receitas
                    </div>
                    <div>
                        <span className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">R$ 0<span className="text-xl opacity-50">,00</span></span>
                    </div>
                </div>

                {/* Despesas */}
                <div className="rounded-xl border border-border bg-card p-6 flex flex-col justify-between shadow-sm">
                    <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400 font-bold">
                        <TrendingDown className="h-5 w-5" /> Saídas / Despesas
                    </div>
                    <div>
                        <span className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">R$ 0<span className="text-xl opacity-50">,00</span></span>
                    </div>
                </div>
            </div>

            <div className="h-96 rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center mt-4 shadow-sm">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-bold text-foreground">Nenhum Movimento</h3>
                <p className="text-muted-foreground max-w-sm mt-2 font-medium">Os fluxos financeiros de encerramento da Agenda aparecerão aqui.</p>
            </div>
        </div>
    );
}
