"use client";

import { useEffect, useState } from "react";
import { useClientApi } from '@/lib/api/useClientApi';
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
    const { api } = useClientApi();
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
                <button className="flex items-center gap-2 rounded-xl bg-card border border-border px-3 py-2 hover:bg-muted transition-colors group shadow-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Mic2 className="h-4 w-4" />
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Artista Ativo</p>
                        <p className="text-sm font-bold text-foreground flex items-center gap-1">
                            {selectedArtist?.name || "Selecione..."}
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </p>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2 bg-popover border border-border rounded-xl shadow-xl">
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
                                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                                    isSelected
                                        ? "bg-primary text-primary-foreground"
                                        : "text-foreground hover:bg-muted"
                                )}
                            >
                                <span className="truncate">{artist.name}</span>
                                {isSelected && <Check className="h-4 w-4 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}
