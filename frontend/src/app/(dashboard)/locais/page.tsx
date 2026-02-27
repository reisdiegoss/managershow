import { Suspense } from "react";
import { MapPin, Building2, Map } from "lucide-react";

export default function LocaisPage() {
    return (
        <div className="flex h-full flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight text-white mb-2 uppercase flex items-center gap-3">
                        <MapPin className="h-8 w-8 text-indigo-500" />
                        Locais (Venues)
                    </h1>
                    <p className="text-slate-400 font-medium">Gestão de Casas de Show, Festivais e Prefeituras base.</p>
                </div>
                <button className="btn-premium px-6 py-2 rounded-xl text-white font-bold tracking-wide text-sm bg-indigo-600 shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-all">
                    Novo Local
                </button>
            </div>

            <div className="h-96 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center mt-4">
                <Building2 className="h-12 w-12 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-slate-300">Nenhum Local Cadastrado</h3>
                <p className="text-slate-500 max-w-sm mt-2">Comece registrando as Venues frequentes onde os artistas se apresentam para o CRM e Histórico.</p>
            </div>
        </div>
    );
}
