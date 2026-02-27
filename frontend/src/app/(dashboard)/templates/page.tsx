import { Suspense } from "react";
import { FileText, Plus, FileCode2 } from "lucide-react";

export default function TemplatesPage() {
    return (
        <div className="flex h-full flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight text-white mb-2 uppercase flex items-center gap-3">
                        <FileText className="h-8 w-8 text-amber-500" />
                        Templates
                    </h1>
                    <p className="text-slate-400 font-medium">Modelos de Contratos, Minutas e Daysheets.</p>
                </div>
                <button className="btn-premium px-6 py-2 rounded-xl text-white font-bold tracking-wide text-sm bg-amber-600 shadow-lg shadow-amber-500/20 hover:bg-amber-500 transition-all flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Novo Template
                </button>
            </div>

            <div className="h-96 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center mt-4">
                <FileCode2 className="h-12 w-12 text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-slate-300">Construtor Desativado</h3>
                <p className="text-slate-500 max-w-sm mt-2">Os templates padrão do Manager Show (Formulários base) ainda não customizáveis.</p>
            </div>
        </div>
    );
}
