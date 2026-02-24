"use client";

import { useState } from "react";
import { Venue } from "@/types/base";
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
    MapPin,
    MoreHorizontal,
    Search,
    Users,
    Map,
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

const mockVenues: Venue[] = [
    { id: "1", name: "Espaço Unimed", capacity: 8000, city: "São Paulo", state: "SP", address: "R. Tagipuru, 795 - Barra Funda" },
    { id: "2", name: "Allianz Parque", capacity: 45000, city: "São Paulo", state: "SP", address: "Av. Francisco Matarazzo, 1705 - Água Branca" },
    { id: "3", name: "Km de Vantagens Hall", capacity: 4000, city: "Belo Horizonte", state: "MG", address: "Av. Nossa Sra. do Carmo, 230 - Savassi" },
];

export default function VenuesPage() {
    const [venues, setVenues] = useState<Venue[]>(mockVenues);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const handleAddVenue = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newVenue: Venue = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.get('name') as string,
            capacity: Number(formData.get('capacity')),
            city: formData.get('city') as string,
            state: formData.get('state') as string,
            address: formData.get('address') as string,
        };

        setVenues([newVenue, ...venues]);
        setIsModalOpen(false);
        toast({
            title: "Sucesso!",
            description: "Local cadastrado com sucesso.",
        });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                        Gestão de <span className="text-indigo-600">Locais</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Venues, Teatros e Arenas cadastradas
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase italic shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-5 w-5" /> Novo Local
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black italic uppercase tracking-tight">Cadastrar Local</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddVenue} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome do Local</Label>
                                <Input id="name" name="name" placeholder="Ex: Espaço Unimed" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="capacity" className="text-[10px] font-black uppercase text-slate-500 ml-1">Capacidade de Público</Label>
                                <Input id="capacity" name="capacity" type="number" placeholder="Ex: 8000" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-[10px] font-black uppercase text-slate-500 ml-1">Endereço Completo</Label>
                                <Input id="address" name="address" placeholder="Rua, número, bairro..." className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="city" className="text-[10px] font-black uppercase text-slate-500 ml-1">Cidade</Label>
                                    <Input id="city" name="city" placeholder="São Paulo" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state" className="text-[10px] font-black uppercase text-slate-500 ml-1">UF</Label>
                                    <Input id="state" name="state" placeholder="SP" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white" maxLength={2} />
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full rounded-2xl bg-indigo-600 py-6 text-sm font-black uppercase italic shadow-xl shadow-indigo-100">
                                    Salvar Local
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tabela de Locais */}
            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-0">
                            <TableHead className="w-[80px] text-center"></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Local / Capacidade</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Localização</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {venues.map((v) => (
                            <TableRow key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-6 flex justify-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                        <MapPin className="h-6 w-6" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-black text-slate-900 italic uppercase">{v.name}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Users className="h-3 w-3 text-slate-400" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{v.capacity.toLocaleString()} Pessoas</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <Map className="h-3 w-3" /> {v.city} - {v.state}
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{v.address}</p>
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
