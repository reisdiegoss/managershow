import React from 'react';
import { CloudRain, Sun, Cloud, Snowflake } from 'lucide-react';

interface WeatherWidgetProps {
    temp: number | null;
    condition: string | null;
    className?: string;
}

export function WeatherWidget({ temp, condition, className = "" }: WeatherWidgetProps) {
    const renderIcon = () => {
        if (!condition) return <Cloud className="h-4 w-4 text-emerald-500" />;
        const lowCondition = condition.toLowerCase();

        if (lowCondition.includes("chuva") || lowCondition.includes("rain")) {
            return <CloudRain className="h-4 w-4 text-blue-400" />;
        }
        if (lowCondition.includes("neve") || lowCondition.includes("snow")) {
            return <Snowflake className="h-4 w-4 text-white" />;
        }
        if (lowCondition.includes("sol") || lowCondition.includes("limpo") || lowCondition.includes("clear")) {
            return <Sun className="h-4 w-4 text-yellow-400" />;
        }
        return <Cloud className="h-4 w-4 text-emerald-500" />;
    };

    return (
        <div className={`rounded-2xl bg-slate-900/80 border border-white/5 p-4 backdrop-blur-xl shadow-xl ${className}`}>
            <div className="flex items-center gap-2 text-slate-500 mb-2">
                {renderIcon()}
                <span className="text-[10px] font-black uppercase tracking-widest">Clima</span>
            </div>

            {temp !== null ? (
                <p className="text-lg font-black text-white italic">
                    {Math.round(temp)}°C
                    <span className="ml-1 text-[10px] text-slate-400 lowercase font-medium">
                        ({condition || 'Sem info'})
                    </span>
                </p>
            ) : (
                <p className="text-[10px] text-slate-500 italic mt-2">API OpenWeather Desconectada.</p>
            )}
        </div>
    );
}
