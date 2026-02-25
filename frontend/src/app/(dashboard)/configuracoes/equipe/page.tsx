"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { Users, Shield, Eye, Settings2, Plus, Mail, Check, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

/**
 * Página de Gestão de Equipe (Fase 24: Matriz de Visibilidade)
 */
export default function TeamManagementPage() {
    const { api } = useApi();
    const { toast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, artistsRes] = await Promise.all([
                api.get("/client/users"),
                api.get("/client/artists")
            ]);
            setUsers(usersRes.data);
            setArtists(artistsRes.data);
        } catch (err) {
            console.error("Erro ao carregar dados da equipe:", err);
            toast({
                title: "Erro",
                description: "Não foi possível carregar os dados da equipe.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [api]);

    return (
        <div className="flex h-full flex-col space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-100">
                        Gestão de <span className="text-indigo-500">Equipe</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-400 italic">
                        Matriz de Visibilidade Nível 3: Controle o escopo de cada usuário.
                    </p>
                </div>
                <button className="btn-premium flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20">
                    <Plus className="h-5 w-5" />
                    Convidar Membro
                </button>
            </div>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-white/5 border border-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                        <UserCard key={user.id} user={user} artists={artists} onUpdate={fetchData} />
                    ))}
                </div>
            )}
        </div>
    );
}

function UserCard({ user, artists, onUpdate }: { user: any, artists: any[], onUpdate: () => void }) {
    const { api } = useApi();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isGlobal, setIsGlobal] = useState(user.has_global_artist_access);
    const [selectedArtists, setSelectedArtists] = useState<string[]>(
        user.allowed_artists?.map((a: any) => a.id) || []
    );
    const [saving, setSaving] = useState(false);

    const handleSaveVisibility = async () => {
        try {
            setSaving(true);
            await api.patch(`/client/users/${user.id}/visibility`, {
                has_global_artist_access: isGlobal,
                artist_ids: selectedArtists
            });

            toast({
                title: "Sucesso",
                description: `Visibilidade de ${user.name} atualizada.`,
            });
            setOpen(false);
            onUpdate();
        } catch (err) {
            toast({
                title: "Erro",
                description: "Falha ao salvar permissões.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const toggleArtist = (id: string) => {
        setSelectedArtists(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    return (
        <div className="glass-card border border-white/5 p-6 rounded-2xl flex flex-col gap-6 hover:border-indigo-500/30 transition-all group/card relative">

            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover/card:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-100 italic uppercase tracking-tight truncate">{user.name}</h3>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate font-medium uppercase tracking-wider">
                        <Mail className="h-3 w-3" /> {user.email}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase text-slate-300">Cargo: {user.role?.name || "N/A"}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase text-slate-300">Visão Global</span>
                    </div>
                    <Switch checked={user.has_global_artist_access} disabled />
                </div>
            </div>

            <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest italic">Acesso aos Artistas</p>
                {user.has_global_artist_access ? (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase w-fit border border-emerald-500/20">
                        Acesso Ilimitado (Global)
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {user.allowed_artists?.map((artist: any) => (
                            <span key={artist.id} className="px-2 py-1 rounded bg-slate-900 text-indigo-400 text-[9px] font-black uppercase border border-indigo-500/20 shadow-sm shadow-indigo-500/5">
                                {artist.name}
                            </span>
                        ))}
                        {(user.allowed_artists?.length || 0) === 0 && (
                            <span className="text-[10px] text-rose-500 font-black italic uppercase tracking-tighter">🚫 Nenhum artista vinculado</span>
                        )}
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <button className="w-full py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 group">
                        <Settings2 className="h-4 w-4 group-hover:text-indigo-400" />
                        Editar Escopo de Acesso
                    </button>
                </DialogTrigger>
                <DialogContent className="glass-card border-white/10 bg-slate-950/95 text-slate-200 sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
                            Configurar <span className="text-indigo-500">Visibilidade</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-slate-100 uppercase tracking-tight">Visão Global</h4>
                                <p className="text-[10px] text-slate-500 italic">Permitir acesso a todos os artistas da produtora.</p>
                            </div>
                            <Switch checked={isGlobal} onCheckedChange={setIsGlobal} />
                        </div>

                        {!isGlobal && (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest italic px-1">
                                    Selecione os Artistas Permitidos
                                </p>
                                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                    {artists.map((artist) => {
                                        const isSelected = selectedArtists.includes(artist.id);
                                        return (
                                            <button
                                                key={artist.id}
                                                onClick={() => toggleArtist(artist.id)}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected
                                                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                                                    }`}
                                            >
                                                <span className="text-[11px] font-bold uppercase tracking-tight">{artist.name}</span>
                                                {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 opacity-30" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedArtists.length === 0 && (
                                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-500 text-[10px] font-bold italic uppercase">
                                        <X className="h-4 w-4" /> Selecione pelo menos um artista
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={() => setOpen(false)}
                                className="flex-1 py-3 rounded-xl border border-white/10 text-[10px] font-black uppercase text-slate-400 hover:bg-white/10"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveVisibility}
                                disabled={saving || (!isGlobal && selectedArtists.length === 0)}
                                className="flex-1 py-3 rounded-xl bg-indigo-600 font-black uppercase text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-[10px]"
                            >
                                {saving ? "Salvando..." : "Salvar Alterações"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
