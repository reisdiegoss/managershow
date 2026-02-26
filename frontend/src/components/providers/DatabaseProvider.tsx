"use client";

import { useMemo } from "react";
import { database } from "@/lib/db";

// Expondo de forma simplificada sem React Context complexo se não for 100% necessário
// WatermelonDB sugere Context apenas para facilitar injeção de dependência em testes.
// Em um app híbrido simples, importar `database` de `lib/db` direto também funciona.
// Mas para o `@nozbe/with-observables`, ter no contexto oficial ajuda em integrações futuras ou HOCs.

import { createContext, useContext, ReactNode } from "react";
import { Database } from "@nozbe/watermelondb";

const DatabaseContext = createContext<Database | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
    // Evita recriação em re-renders do Layout
    const db = useMemo(() => database, []);

    return (
        <DatabaseContext.Provider value={db}>
            {children}
        </DatabaseContext.Provider>
    );
}

export function useDatabase() {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error("useDatabase must be used within a DatabaseProvider");
    }
    return context;
}
