"use client";

import { TimelineEvent } from "@/types/show";
import {
    Plane,
    Hotel,
    Truck,
    Music,
    CheckCircle,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineProps {
    events: TimelineEvent[];
}

const iconMap = {
    flight: Plane,
    hotel: Hotel,
    van: Truck,
    music: Music,
    check: CheckCircle,
};

export function Timeline({ events }: TimelineProps) {
    return (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-200 before:via-slate-200 before:to-transparent">
            {events.map((event, index) => {
                const Icon = iconMap[event.icon] || Clock;

                return (
                    <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Ícone / Bolinha */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            <Icon className={cn(
                                "h-5 w-5",
                                event.is_highlight ? "text-rose-600" : "text-indigo-600"
                            )} />
                        </div>

                        {/* Conteúdo */}
                        <div className={cn(
                            "w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border transition-all",
                            event.is_highlight
                                ? "bg-rose-50 border-rose-200 shadow-sm"
                                : "bg-white border-slate-100 hover:border-indigo-100"
                        )}>
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <div className={cn(
                                    "font-mono font-black text-sm",
                                    event.is_highlight ? "text-rose-700" : "text-indigo-600"
                                )}>
                                    {event.time}
                                </div>
                                {event.is_highlight && (
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-rose-600 text-white px-2 py-0.5 rounded-full">
                                        Showtime
                                    </span>
                                )}
                            </div>
                            <div className={cn(
                                "text-sm font-black uppercase tracking-tight italic leading-none",
                                event.is_highlight ? "text-rose-900" : "text-slate-900"
                            )}>
                                {event.title}
                            </div>
                            {event.description && (
                                <div className="mt-2 text-[11px] font-medium text-slate-500 leading-relaxed italic">
                                    {event.description}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
