'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShieldAlert, Loader2, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function ImpersonateHandlerPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = params.id as string;

    useEffect(() => {
        if (!tenantId) return;

        // 1. Ativar o modo de simulação no LocalStorage
        localStorage.setItem('impersonate_tenant_id', tenantId);

        // 2. Pequeno delay para efeito visual (UX)
        const timer = setTimeout(() => {
            // Redireciona para o Dashboard principal (raiz)
            router.push('/');
        }, 2000);

        return () => clearTimeout(timer);
    }, [tenantId, router]);

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 overflow-hidden">
            {/* Background Decorator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />

            <Card className="relative z-10 w-full max-w-md rounded-[2.5rem] border-primary/20 bg-card/40 backdrop-blur-2xl p-10 text-center shadow-2xl border">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-primary/20 rotate-6 animate-in zoom-in duration-500">
                            <ShieldAlert size={48} />
                        </div>
                        <div className="absolute -top-3 -right-3 h-10 w-10 bg-background rounded-xl flex items-center justify-center border border-border shadow-lg animate-bounce">
                            <Sparkles className="text-amber-500 h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        God Mode <span className="text-primary font-semibold">Ativado</span>
                    </h1>

                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Sincronizando Identidade...
                        </div>
                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                            Mapeando permissões enterprise para o ID
                            <span className="block mt-1 font-mono text-xs text-foreground font-semibold">
                                {tenantId}
                            </span>
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground">
                        Você está sendo redirecionado para o ambiente de simulação.
                    </p>
                </div>
            </Card>
        </div>
    );
}

