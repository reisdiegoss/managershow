"use client";

import { useState } from "react";
import { Artist } from "@/types/base";
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
    Mic2,
    MoreHorizontal,
    Search,
    Mail,
    Phone,
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

const mockArtists: Artist[] = [
    { id: "1", name: "Alok Petrillo", genre: "Electronic/DJ", status: "ACTIVE", email: "booking@alok.com", phone: "(11) 98888-7777" },
    { id: "2", name: "Zezé Di Camargo", genre: "Sertanejo", status: "ACTIVE", email: "contato@zeze.com", phone: "(62) 99999-0000" },
    { id: "3", name: "Vintage Culture", genre: "Electronic/DJ", status: "ACTIVE", email: "vintage@entourage.com", phone: "(11) 97777-6666" },
    { id: "4", name: "Ana Castela", genre: "AgroPoc/Sertanejo", status: "ACTIVE", email: "ana@castela.com.br", phone: "(67) 98111-2222" },
];

export default function ArtistsPage() {
    const [artists, setArtists] = useState<Artist[]>(mockArtists);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { toast } = useToast();

    const handleAddArtist = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newArtist: Artist = {
            id: Math.random().toString(36).substr(2, 9),
            name: formData.get('name') as string,
            genre: formData.get('genre') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            status: 'ACTIVE',
        };

        setArtists([newArtist, ...artists]);
        setIsModalOpen(false);
        toast({
            title: "Sucesso!",
            description: "Artista cadastrado com sucesso na base.",
        });
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">
                        Gestão de <span className="text-indigo-600">Artistas</span>
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Base oficial de talentos da produtora
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-bold uppercase italic shadow-lg shadow-indigo-200">
                            <Plus className="mr-2 h-5 w-5" /> Novo Artista
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-0 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black italic uppercase tracking-tight">Cadastrar Talentos</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddArtist} className="space-y-6 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-[10px] font-black uppercase text-slate-500 ml-1">Nome do Artista/Banda</Label>
                                <Input id="name" name="name" placeholder="Ex: Alok Petrillo" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="genre" className="text-[10px] font-black uppercase text-slate-500 ml-1">Gênero Musical</Label>
                                <Input id="genre" name="genre" placeholder="Ex: DJ/Eletrônica" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-500 ml-1">E-mail de Contato</Label>
                                    <Input id="email" name="email" type="email" placeholder="contato@..." className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-[10px] font-black uppercase text-slate-500 ml-1">WhatsApp/Tel</Label>
                                    <Input id="phone" name="phone" placeholder="(00) 00000-0000" className="rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all" />
                                </div>
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full rounded-2xl bg-indigo-600 py-6 text-sm font-black uppercase italic shadow-xl shadow-indigo-100">
                                    Salvar Artista
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtros e Busca */}
            <Card className="rounded-3xl border-slate-100 p-4 shadow-sm bg-white">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input placeholder="Pesquisar por nome ou gênero..." className="pl-12 rounded-2xl border-0 bg-slate-50 text-xs font-bold uppercase" />
                    </div>
                    <Button variant="outline" className="rounded-2xl border-slate-100 font-bold uppercase text-[10px] tracking-widest text-slate-500">
                        <Filter className="mr-2 h-4 w-4" /> Filtros
                    </Button>
                </div>
            </Card>

            {/* Lista de Artistas */}
            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm bg-white overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-0">
                            <TableHead className="w-[80px] text-center"></TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Artista / Gênero</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Contato Comercial</TableHead>
                            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-500 py-6">Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {artists.map((artist) => (
                            <TableRow key={artist.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <TableCell className="py-6 flex justify-center">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                        <Mic2 className="h-6 w-6" />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <p className="text-sm font-black text-slate-900 italic uppercase">{artist.name}</p>
                                    <Badge variant="outline" className="mt-1 rounded-full border-slate-200 text-[9px] font-black uppercase text-slate-400 tracking-tighter">{artist.genre}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <Mail className="h-3 w-3" /> {artist.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                            <Phone className="h-3 w-3" /> {artist.phone}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className="rounded-full bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] font-black uppercase">Ativo</Badge>
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
