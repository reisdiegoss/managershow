import { Suspense } from "react";
import { Wallet, DollarSign, TrendingUp, TrendingDown } from "lucide-react";

export default function FinancePage() {
    return (
        <div className="flex h-full flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight text-white mb-2 uppercase flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-emerald-500" />
                        Borderô Financeiro
                    </h1>
                    <p className="text-slate-400 font-medium">Controle de receitas, despesas (DRE) e fechamentos de cachês.</p>
                </div>
                <button className="btn-premium px-6 py-2 rounded-xl text-white font-bold tracking-wide text-sm bg-emerald-600 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all">
                    Novo Lançamento
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Saldo Líquido */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-2 text-slate-400 font-bold">
                        <Wallet className="h-5 w-5 text-emerald-500" /> Saldos e Retenções
                    </div>
                    <div>
                        <span className="text-4xl font-black tracking-tighter text-white">R$ 0<span className="text-xl text-slate-500">,00</span></span>
                    </div>
                </div>

                {/* Receitas */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-2 text-emerald-400 font-bold">
                        <TrendingUp className="h-5 w-5" /> Entradas / Receitas
                    </div>
                    <div>
                        <span className="text-3xl font-black tracking-tighter text-emerald-100">R$ 0<span className="text-xl text-emerald-500/50">,00</span></span>
                    </div>
                </div>

                {/* Despesas */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-2 text-rose-400 font-bold">
                        <TrendingDown className="h-5 w-5" /> Saídas / Despesas
                    </div>
                    <div>
                        <span className="text-3xl font-black tracking-tighter text-rose-100">R$ 0<span className="text-xl text-rose-500/50">,00</span></span>
                    </div>
                </div>
            </div>

            <div className="h-96 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center mt-4">
                <DollarSign className="h-12 w-12 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-slate-300">Nenhum Movimento</h3>
                <p className="text-slate-500 max-w-sm mt-2">Os fluxos financeiros de encerramento da Agenda aparecerão aqui.</p>
            </div>
        </div>
    );
}
