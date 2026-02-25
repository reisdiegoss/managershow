"use client";

import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { Mic2, ChevronDown, Check } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * GlobalArtistSelector (Fase 24: Matriz de Visibilidade)
 * Implementa "Ocultação Inteligente": Se o usuário tem apenas 1 artista, o componente fica oculto.
 */
export function GlobalArtistSelector() {
    const { api } = useApi();
    const [artists, setArtists] = useState<any[]>([]);
    const [selectedArtist, setSelectedArtist] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAllowedArtists() {
            try {
                // O backend já filtra os artistas permitidos via current_user no router
                const response = await api.get("/client/artists");
                const allowed = response.data;
                setArtists(allowed);

                if (allowed.length === 1) {
                    // Ocultação Inteligente: Usuário só tem 1 artista
                    setSelectedArtist(allowed[0]);
                } else if (allowed.length > 1) {
                    // Pega o primeiro ou recupera de um estado global (ex: localStorage)
                    const saved = localStorage.getItem("selected_artist_id");
                    const found = allowed.find((a: any) => a.id === saved) || allowed[0];
                    setSelectedArtist(found);
                }
            } catch (err) {
                console.error("Erro ao carregar artistas permitidos:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAllowedArtists();
    }, [api]);

    // REGRA DE OURO: Se tiver apenas 1 artista, NÃO MOSTRA O SELETOR (UX Limpa)
    if (loading || artists.length <= 1) return null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl bg-slate-800/50 px-4 py-2 border border-white/5 hover:bg-slate-800 transition-all group">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                        <Mic2 className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-left">
                        <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none mb-0.5">Artista Ativo</p>
                        <p className="text-[10px] font-bold text-slate-200 uppercase tracking-tight italic flex items-center gap-1">
                            {selectedArtist?.name || "Selecione..."}
                            <ChevronDown className="h-3 w-3 text-slate-500 group-hover:text-indigo-400" />
                        </p>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2 bg-slate-900 border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
                <div className="space-y-1">
                    {artists.map((artist) => {
                        const isSelected = selectedArtist?.id === artist.id;
                        return (
                            <button
                                key={artist.id}
                                onClick={() => {
                                    setSelectedArtist(artist);
                                    localStorage.setItem("selected_artist_id", artist.id);
                                    window.dispatchEvent(new Event("artist_changed")); // Notifica outros componentes
                                }}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-xl px-3 py-2 text-[10px] font-bold uppercase transition-all",
                                    isSelected
                                        ? "bg-indigo-600 text-white"
                                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                            >
                                {artist.name}
                                {isSelected && <Check className="h-3 w-3" />}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
