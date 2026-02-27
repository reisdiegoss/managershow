import { Suspense } from "react";
import { User, ShieldCheck } from "lucide-react";
import { UserProfile } from "@clerk/nextjs";

export default function ProfilePage() {
    return (
        <div className="flex h-full flex-col gap-6 w-full animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tight text-white mb-2 uppercase flex items-center gap-3">
                        <User className="h-8 w-8 text-indigo-500" />
                        Perfil da Conta
                    </h1>
                    <p className="text-slate-400 font-medium">Gestão Criptográfica, Acessos e Configurações de Login.</p>
                </div>
            </div>

            <div className="w-full h-full rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6 mt-4 flex justify-center pb-24">
                {/* Gerenciamento Master Clerk Configurado Globalmente via Provier Context */}
                <UserProfile />
            </div>
        </div>
    );
}
