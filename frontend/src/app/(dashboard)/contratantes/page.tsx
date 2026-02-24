"use client";

import { useState } from "react";
import { Contractor } from "@/types/base";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Building2,
    MoreHorizontal,
    Search,
    Mail,
    Phone,
    MapPin,
    Filter
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

const mockContractors: Contractor[] = [
    { id: "1", name: "Opus Entretenimento", document: "123.456.789-00", email: "comercial@opus.com.br", phone: "(11) 3222-1111", city: "São Paulo", state: "SP" },
    { id: "2", name: "DC Set Promoções", document: "00.111.222/0001-99", email: "contato@dcset.com.br", phone: "(11) 3333-4444", city: "Porto Alegre", state: "RS" },
    { id: "3", name: "Ribeirão Eventos", document: "99.888.777/0001-55", email: "financeiro@ribeirao.com", phone: "(16) 99111-2233", city: "Ribeirão Preto", state: "SP" },
];

export default function ContractorsPage() {
    const [contractors, setContractors] = useState<Contractor[]>(mockContractors);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const handleAddContractor = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newContractor: Contractor = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.get('name') as string,
            document: formData.get('document') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            city: formData.get('city') as string,
            state: formData.get('state') as string,
        };

        setContractors([newContractor, ...contractors]);
        setIsModalOpen(false);
        toast({
            title: "Sucesso!",
            description: "Contratante adicionado à base de dados.",
        });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                        Gestão de <span className="text-indigo-600">Contratantes</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Empresas e promotores parceiros
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase italic shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-5 w-5" /> Novo Contratante
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black italic uppercase tracking-tight">Cadastrar Contratante</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddContractor} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-500 ml-1">Razão Social / Nome</Label>
                                <Input id="name" name="name" placeholder="Ex: Opus Entretenimento" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="document" className="text-[10px] font-black uppercase text-slate-500 ml-1">CNPJ / CPF</Label>
                                <Input id="document" name="document" placeholder="00.000.000/0001-00" className="rounded-xl border-slate-100 bg-slate-50" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-500 ml-1">E-mail</Label>
                                    <Input id="email" name="email" type="email" placeholder="financeiro@..." className="rounded-xl border-slate-100 bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-500 ml-1">Telefone</Label>
                                    <Input id="phone" name="phone" placeholder="(00) 0000-0000" className="rounded-xl border-slate-100 bg-slate-50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="city" className="text-[10px] font-black uppercase text-slate-500 ml-1">Cidade</Label>
                                    <Input id="city" name="city" placeholder="Pouso Alegre" className="rounded-xl border-slate-100 bg-slate-50" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-[10px] font-black uppercase text-slate-500 ml-1">UF</Label>
                                    <Input id="state" name="state" placeholder="MG" className="rounded-xl border-slate-100 bg-slate-50" maxLength={2} />
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full rounded-2xl bg-indigo-600 py-6 text-sm font-black uppercase italic shadow-xl shadow-indigo-100">
                                    Salvar Contratante
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabela de Contratantes */}
            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-0">
                            <TableHead className="w-[80px] text-center"></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Parceiro / Documento</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Contato / Localização</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contractors.map((c) => (
                            <TableRow key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-6 flex justify-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-black text-slate-900 italic uppercase">{c.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{c.document}</p>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <Mail className="h-3 w-3" /> {c.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <MapPin className="h-3 w-3" /> {c.city} - {c.state}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="rounded-xl">
                                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
