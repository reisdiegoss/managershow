"use client";

import { Show } from "@/types/show";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ShowCardProps {
    show: Show;
}

/**
 * Componente ShowCard - Exibição Premium de um Evento no Kanban.
 * Estilizado conforme o prototipo.html e as diretrizes do Shadcn UI.
 */
export function ShowCard({ show }: ShowCardProps) {
    // Formatação da data (ex: 04 Fev)
    const formattedDate = format(new Date(show.date_show), "dd MMM", { locale: ptBR });

    return (
        <Card class="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md cursor-grab active:cursor-grabbing">
            {/* Indicador de Tipo de Cliente (Badge Superior) */}
            <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-1 text-xs font-bold text-slate-400">
                    <Calendar className="h-3 w-3" />
                    <span class="uppercase tracking-tighter">{formattedDate}</span>
                </div>
                <Badge
                    variant="secondary"
                    className={`text-[10px] font-bold uppercase tracking-widest ${show.client_type === 'PUBLIC'
                            ? "bg-blue-50 text-blue-600 border-blue-100"
                            : "bg-purple-50 text-purple-600 border-purple-100"
                        }`}
                >
                    {show.client_type === 'PUBLIC' ? 'Governo' : 'Privado'}
                </Badge>
            </div>

            {/* Localidade e Detalhes */}
            <div class="space-y-1">
                <h4 class="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-indigo-500" />
                    {show.location_city} - {show.location_uf}
                </h4>
                <p class="text-[11px] font-medium text-slate-500 italic">
                    {show.negotiation_type || 'Tipo de Negociação'}
                </p>
            </div>

            {/* Valor (Opcional - mas presente no DRE/Financeiro) */}
            <div class="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                <div class="flex items-center gap-1 text-indigo-600">
                    <DollarSign className="h-3 w-3" />
                    <span class="text-xs font-bold leading-none">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(show.base_price)}
                    </span>
                </div>

                {/* Avatar Placeholder para Artista (se houver múltiplos) */}
                <div class="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-white">
                    <span class="text-[8px] font-bold text-slate-400">A</span>
                </div>
            </div>
        </Card>
    );
}
