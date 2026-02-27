import { Suspense } from "react";
import { FolderOpen } from "lucide-react";

export default function LogisticsPage() {
    return (
        <div className="flex h-full flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight text-white mb-2 uppercase flex items-center gap-3">
                        <FolderOpen className="h-8 w-8 text-indigo-500" />
                        Logística Operacional
                    </h1>
                    <p className="text-slate-400 font-medium">Controle de passagens, hospedagens, transportes e traslados dos shows.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="h-64 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center text-center">
                        <FolderOpen className="h-12 w-12 text-slate-700 mb-4" />
                        <h3 className="text-xl font-bold text-slate-300">Nenhuma Viagem Pendente</h3>
                        <p className="text-slate-500 max-w-sm mt-2">Sem shows aprovados requirindo gestão logística na presente data.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="h-96 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
                        <h3 className="font-bold text-slate-300 mb-4">Avisos e Pendências</h3>
                        <div className="space-y-4">
                            <div className="animate-pulse flex space-x-4">
                                <div className="rounded-full bg-slate-800 h-10 w-10"></div>
                                <div className="flex-1 space-y-6 py-1">
                                    <div className="h-2 bg-slate-800 rounded"></div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="h-2 bg-slate-800 rounded col-span-2"></div>
                                            <div className="h-2 bg-slate-800 rounded col-span-1"></div>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
