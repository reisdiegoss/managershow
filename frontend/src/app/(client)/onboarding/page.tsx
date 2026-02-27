"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { Building2, Palette, ShieldCheck, CheckCircle2, Loader2, Users } from "lucide-react";

export default function OnboardingWizard() {
    const { getToken } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // States: Passo 1 (Branding)
    const [officeName, setOfficeName] = useState("");
    const [primaryColor, setPrimaryColor] = useState("#d4af37"); // Gold Master
    const [logoFile, setLogoFile] = useState<File | null>(null);

    // States: Passo 2 (Motor de Parametrização)
    const [requireVisualLock, setRequireVisualLock] = useState(true);
    const [defaultAgencyFee, setDefaultAgencyFee] = useState(15);
    const [primaryNegotiationModel, setPrimaryNegotiationModel] = useState("CACHE_MAIS_DESPESAS");
    const [requiredFields, setRequiredFields] = useState(["location_city"]);

    async function handleFinishWizard() {
        setIsSubmitting(true);

        // Todo: Adicionar S3 upload step aqui se logoFile não for null antes de ir pra API.
        // Simulando que o upload foi feito e temos uma URL ficticia temporaria.
        const mockUploadedUrl = logoFile ? "https://manager-show-storage.s3.amazonaws.com/temp-logo.jpg" : "";

        const payload = {
            primary_color: primaryColor,
            negotiation_setup: {
                primary_model: primaryNegotiationModel,
                required_fields: requiredFields,
            }
        };

        try {
            const token = await getToken();
            await api.post("/client/wizard/complete", payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Manager Show configurado com sucesso! Bem-vindo!");
            // Força a recarga para rodar o middleware novamente e atualizar claims caso a API modifique Clerk metadata
            window.location.href = "/dashboard";
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Erro ao configurar onboarding. Contate o suporte.");
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decorativo Glass */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-600/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-600/10 blur-[120px]" />

            <Card className="w-full max-w-3xl bg-slate-900/40 backdrop-blur-xl border-slate-800 shadow-2xl relative z-10">
                <CardHeader className="text-center pb-8 border-b border-slate-800/50 mb-6">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center mb-4">
                        <Building2 className="w-8 h-8 text-black" />
                    </div>
                    <CardTitle className="text-3xl font-light text-white tracking-tight">Configure o Manager Show</CardTitle>
                    <CardDescription className="text-slate-400 text-lg">
                        Poucos passos nos separam de profissionalizar a gestão da sua Produtora.
                    </CardDescription>

                    {/* Stepper Progress */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${step >= 1 ? 'border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-500'}`}>1</div>
                            <span className={`text-sm ${step >= 1 ? 'text-slate-200' : 'text-slate-600'}`}>Sua Marca</span>
                        </div>
                        <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-yellow-500/50' : 'bg-slate-800'}`} />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${step >= 2 ? 'border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-500'}`}>2</div>
                            <span className={`text-sm ${step >= 2 ? 'text-slate-200' : 'text-slate-600'}`}>Motor ERP</span>
                        </div>
                        <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-yellow-500/50' : 'bg-slate-800'}`} />
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${step >= 3 ? 'border-yellow-500 text-yellow-500' : 'border-slate-700 text-slate-500'}`}>3</div>
                            <span className={`text-sm ${step >= 3 ? 'text-slate-200' : 'text-slate-600'}`}>Time</span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-6 pb-8 md:px-12">

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div>
                                <Label className="text-slate-300">Como o Escritório se chama?</Label>
                                <Input
                                    value={officeName}
                                    onChange={(e) => setOfficeName(e.target.value)}
                                    placeholder="Ex: Gold Shows S.A"
                                    className="bg-slate-900 border-slate-700 text-lg mt-2 focus:border-yellow-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-slate-300 flex items-center gap-2 mb-2"><Palette className="w-4 h-4" /> Cor Primária (Painel)</Label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="color"
                                            value={primaryColor}
                                            onChange={(e) => setPrimaryColor(e.target.value)}
                                            className="w-14 h-14 p-1 bg-slate-900 border-slate-700 cursor-pointer"
                                        />
                                        <span className="text-slate-400 uppercase">{primaryColor}</span>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-slate-300 mb-2 block">Upload do Logotipo</Label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900 hover:border-yellow-500 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {logoFile ? (
                                                    <p className="text-sm text-yellow-400 font-medium">{logoFile.name}</p>
                                                ) : (
                                                    <p className="text-sm text-slate-400"><span className="font-semibold text-slate-300">Gere os NFTs</span> e arrastou a logo .PNG</p>
                                                )}
                                            </div>
                                            <Input type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-6">
                                <h4 className="flex items-center gap-2 text-yellow-500 font-medium mb-2"><ShieldCheck className="w-5 h-5" /> A Trava Mestra Visual</h4>
                                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                                    Com a trava ativa, nenhum pagamento na estrada poderá ser liberado e nenhum checklist do Day Sheet avança enquanto o status do Show não for "CONTRATO ASSINADO". Fortalece a segurança da produtora.
                                </p>
                                <div className="flex items-center justify-between">
                                    <Label>Ativar Trava Logística</Label>
                                    <Switch checked={requireVisualLock} onCheckedChange={setRequireVisualLock} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label className="text-slate-300">Negociação Padrão Mais Usada</Label>
                                    <Select value={primaryNegotiationModel} onValueChange={setPrimaryNegotiationModel}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 mt-2">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                            <SelectItem value="CACHE_MAIS_DESPESAS">Cachê + Despesas Extras</SelectItem>
                                            <SelectItem value="COLOCADO_TOTAL">Colocado Total (Tudo Incluído)</SelectItem>
                                            <SelectItem value="BILHETERIA">Apenas Bilheteria / Porta</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-slate-300">Campos Obrigatórios Para Validar Venda</Label>
                                    <Select value={requiredFields[0]} onValueChange={(v) => setRequiredFields([v])}>
                                        <SelectTrigger className="bg-slate-900 border-slate-700 mt-2">
                                            <SelectValue placeholder="O que tranca o show?" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                            <SelectItem value="location_city">Cidade Base é Suficiente</SelectItem>
                                            <SelectItem value="location_venue">Casa de Show Específica (Venue) Exigida</SelectItem>
                                            <SelectItem value="client_cnpj">CNPJ Validado Obrigatório</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-slate-300">Taxa Padrão da Produtora do Contrato (%)</Label>
                                <Input
                                    type="number"
                                    value={defaultAgencyFee}
                                    onChange={(e) => setDefaultAgencyFee(Number(e.target.value))}
                                    className="bg-slate-900 border-slate-700 mt-2 focus:border-yellow-500 w-full"
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
                                <Users className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-light text-slate-200">Convide seu Time-Base (Opcional)</h3>
                            <p className="text-slate-400">O sistema é feito para ser orgânico. Convide lideranças para acessar agora mesmo.</p>

                            <div className="flex gap-3 max-w-md mx-auto mt-6">
                                <Input className="bg-slate-900 border-slate-700" placeholder="produtor@suaagencia.com.br" />
                                <Select defaultValue="producer">
                                    <SelectTrigger className="bg-slate-900 border-slate-700 w-[140px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                                        <SelectItem value="admin">Sócio</SelectItem>
                                        <SelectItem value="seller">Vendedor</SelectItem>
                                        <SelectItem value="producer">Produtor</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" className="border-slate-700 text-slate-300">Criar</Button>
                            </div>

                            <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-md mx-auto flex items-start gap-3 text-left">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-emerald-50">Tudo pronto! Seu cadastro de Onboarding criará este tenant de forma estruturada, com cor, logo e as regras logísticas parametrizadas.</p>
                            </div>
                        </div>
                    )}

                    {/* Footer Controls */}
                    <div className="flex items-center justify-between mt-12 pt-6 border-t border-slate-800/50">
                        <Button
                            variant="ghost"
                            onClick={() => setStep(step - 1)}
                            disabled={step === 1 || isSubmitting}
                            className="text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                            Voltar
                        </Button>

                        {step < 3 ? (
                            <Button
                                onClick={() => setStep(step + 1)}
                                className="bg-slate-100 text-slate-900 hover:bg-white px-8"
                            >
                                Avançar
                            </Button>
                        ) : (
                            <Button
                                onClick={handleFinishWizard}
                                disabled={isSubmitting}
                                className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 transition-all"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Building2 className="w-4 h-4 mr-2" />}
                                Finalizar Onboarding
                            </Button>
                        )}
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
