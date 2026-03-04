"use client";

import React from "react";
import { useClientApi } from '@/lib/api/useClientApi';
import {
    Users,
    HardDrive,
    MessageSquare,
    Zap,
    Plus,
    CheckCircle2,
    ShoppingBag,
    LayoutGrid,
    Target
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function BillingStorePage() {
    const { getMe, getBillingCatalog, buyBundle, buyAddon } = useClientApi();
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(true);
    const [tenant, setTenant] = React.useState<any>(null);
    const [catalog, setCatalog] = React.useState<any>(null);
    const [processingId, setProcessingId] = React.useState<string | null>(null);

    const fetchData = React.useCallback(async () => {
        try {
            const [meRes, catalogRes] = await Promise.all([
                getMe(),
                getBillingCatalog()
            ]);
            setTenant(meRes.data.tenant);
            setCatalog(catalogRes.data);
        } catch (err) {
            console.error("Erro ao carregar dados da loja:", err);
            toast({
                title: "Erro de Conexão",
                description: "Não foi possível carregar os dados da loja.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [getMe, getBillingCatalog, toast]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleBuyBundle = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await buyBundle(id);
            toast({ title: "Sucesso!", description: res.data.message });
            await fetchData();
        } catch (err) {
            toast({ title: "Falha na Compra", description: "Houve um erro ao processar seu pedido.", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleBuyAddon = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await buyAddon(id);
            toast({ title: "Recurso Adicionado", description: res.data.message });
            await fetchData();
        } catch (err) {
            toast({ title: "Falha na Compra", description: "Houve um erro ao processar seu pedido.", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-16">
            {/* Header / Current Limits */}
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vercel & Growth</h1>
                    <p className="text-muted-foreground">Gerencie seus recursos e escale de acordo com sua necessidade.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-none bg-primary/5 shadow-none overflow-hidden relative">
                        <Users className="absolute -right-4 -bottom-4 h-24 w-24 text-primary/10" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Usuários Ativos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{tenant?.users_limit}</div>
                            <p className="text-xs text-muted-foreground mt-1">Capacidade total do sistema</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-emerald-500/5 shadow-none overflow-hidden relative">
                        <HardDrive className="absolute -right-4 -bottom-4 h-24 w-24 text-emerald-500/10" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <HardDrive className="h-4 w-4 text-emerald-600" /> Armazenamento S3
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{tenant?.storage_limit_gb} GB</div>
                            <Progress value={20} className="h-1.5 mt-3" />
                            <p className="text-xs text-muted-foreground mt-2">Bucket isolado em Minio Cluster</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-sky-500/5 shadow-none overflow-hidden relative">
                        <MessageSquare className="absolute -right-4 -bottom-4 h-24 w-24 text-sky-500/10" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-sky-600" /> Instâncias WhatsApp
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{tenant?.whatsapp_limit}</div>
                            <p className="text-xs text-muted-foreground mt-1">Conexões Evolution API ativas</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <hr className="border-border/50" />

            {/* Catalogo de Bundles */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5 text-primary" /> Combos de Assinatura
                    </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {catalog?.bundles.map((bundle: any) => (
                        <Card key={bundle.id} className="relative overflow-hidden hover:border-primary/50 transition-all group border-muted">
                            {tenant?.users_limit === bundle.users && (
                                <div className="absolute top-0 right-0 p-2">
                                    <Badge variant="default" className="bg-primary text-primary-foreground">Atual</Badge>
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-xl">{bundle.name}</CardTitle>
                                <CardDescription>{bundle.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-4xl font-black text-foreground">
                                    R$ {bundle.price}<span className="text-base font-normal text-muted-foreground">/mês</span>
                                </div>
                                <ul className="space-y-3 pt-4">
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {bundle.users} Usuários inclusos
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {bundle.storage_gb}GB de Armazenamento
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {bundle.whatsapp} Conexões WhatsApp
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full font-bold"
                                    variant={tenant?.users_limit === bundle.users ? "outline" : "default"}
                                    disabled={processingId === bundle.id || tenant?.users_limit === bundle.users}
                                    onClick={() => handleBuyBundle(bundle.id)}
                                >
                                    {processingId === bundle.id ? "Processando..." : tenant?.users_limit === bundle.users ? "Plano Ativo" : "Migrar Agora"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Catalogo de Addons */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Plus className="h-5 w-5 text-emerald-500" /> Add-ons Sob Demanda
                    </h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {catalog?.addons.map((addon: any) => (
                        <Card key={addon.id} className="border-dashed bg-muted/5 hover:bg-muted/10 transition-colors">
                            <CardContent className="pt-6">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className="p-3 rounded-full bg-background border border-border">
                                        {addon.type === 'STORAGE' ? <HardDrive className="h-6 w-6 text-emerald-500" /> :
                                            addon.type === 'USERS' ? <Users className="h-6 w-6 text-primary" /> :
                                                <MessageSquare className="h-6 w-6 text-sky-500" />}
                                    </div>
                                    <h3 className="font-bold text-sm">{addon.name}</h3>
                                    <div className="text-2xl font-black">R$ {addon.price}</div>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">+ {addon.quantity} {addon.type}</p>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    variant="outline"
                                    className="w-full text-xs h-8"
                                    disabled={processingId === addon.id}
                                    onClick={() => handleBuyAddon(addon.id)}
                                >
                                    {processingId === addon.id ? "..." : "Adicionar"}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}

                    <Card className="border-none bg-gradient-to-br from-primary/10 to-indigo-500/10 flex flex-col justify-center items-center text-center p-6 border-dashed">
                        <Zap className="h-8 w-8 text-primary mb-3 animate-pulse" />
                        <h3 className="font-bold text-sm">Precisa de escala ilimitada?</h3>
                        <p className="text-xs text-muted-foreground mt-1">Fale com nosso time de Enterprise para planos customizados.</p>
                        <Button variant="ghost" className="mt-4 text-xs">Entrar em contato</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
