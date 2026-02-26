import React from 'react';

interface ActiveRouteMapProps {
    address: string;
    city: string;
    uf: string;
    className?: string;
}

export function ActiveRouteMap({ address, city, uf, className = "" }: ActiveRouteMapProps) {
    // API KEY do ambiente (Se Vazia usamos fallback ou placeholder)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

    // Concatena tudo e cria query param seguro para a URL
    const queryStr = encodeURIComponent(`${address}, ${city} - ${uf}`);

    if (!apiKey) {
        return (
            <div className={`flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-white/5 rounded-2xl text-slate-500 text-xs italic text-center ${className}`}>
                <p>Google Maps indisponível.</p>
                <p className="text-[10px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada.</p>
            </div>
        );
    }

    return (
        <div className={`w-full overflow-hidden rounded-2xl border border-white/10 shadow-xl ${className}`}>
            <iframe
                title="Google Maps Route"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '300px' }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${queryStr}&zoom=15`}
            />
        </div>
    );
}
