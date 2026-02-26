"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Image as ImageIcon, FileVideo, X, Camera, Plus, CheckCircle2, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/lib/api";

interface MediaItem {
    id: string;
    url: string;
    type: string;
    filename: string;
}

interface ExecutionMediaGalleryProps {
    showId: string;
    initialMedia?: MediaItem[];
}

export function ExecutionMediaGallery({ showId, initialMedia = [] }: ExecutionMediaGalleryProps) {
    const [mediaList, setMediaList] = useState<MediaItem[]>(initialMedia);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadExecutionMedia } = useApi();
    const { toast } = useToast();

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleUpload(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await handleUpload(Array.from(e.target.files));
        }
    };

    const handleUpload = async (files: File[]) => {
        const validFiles = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));

        if (validFiles.length === 0) {
            toast({
                title: "Arquivos inválidos",
                description: "Apenas imagens e vídeos são permitidos para comprovação.",
                variant: "destructive"
            });
            return;
        }

        setIsUploading(true);
        try {
            const response = await uploadExecutionMedia(showId, validFiles);

            if (response.data.status === 'success' || response.data.status === 'partial_success') {
                // Adicionar as mídias recém-enviadas ao estado
                const newMedia = response.data.uploaded.map((m: any, idx: number) => ({
                    id: `temp-${Date.now()}-${idx}`,
                    url: m.url,
                    type: m.filename.match(/\.(mp4|mov|webm)$/i) ? 'video/mp4' : 'image/jpeg',
                    filename: m.filename
                }));

                setMediaList(prev => [...newMedia, ...prev]);

                toast({
                    title: "Upload Concluído",
                    description: `${newMedia.length} mídias de comprovação enviadas.`,
                });
            } else {
                throw new Error("Falha no upload");
            }
        } catch (error) {
            toast({
                title: "Erro no Upload",
                description: "Não foi possível enviar as mídias. Tente novamente ou verifique sua conexão.",
                variant: "destructive"
            });
            console.error(error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <Card className="rounded-[2.5rem] border-white/5 p-8 shadow-2xl glass-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-fuchsia-500/10 p-3 rounded-2xl">
                        <Camera className="h-6 w-6 text-fuchsia-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-100 italic">Comprovação Fiscal</h3>
                        <p className="text-xs text-slate-400">Fotos e vídeos para atesto governamental</p>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="rounded-full bg-white/5 border-white/10 text-white hover:bg-fuchsia-500 hover:text-white transition-all border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Plus className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Enviando..." : "Nova Mídia"}
                </Button>
                <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
            </div>

            {/* Dropzone */}
            <div
                className={cn(
                    "border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ease-in-out mb-8",
                    dragActive ? "border-fuchsia-500 bg-fuchsia-500/5 scale-[1.02]" : "border-slate-700 bg-white/5",
                    isUploading ? "opacity-50 pointer-events-none" : "hover:border-slate-500"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="pointer-events-none flex flex-col items-center gap-3">
                    <div className={cn("p-4 rounded-full transition-transform", dragActive ? "bg-fuchsia-500/20 scale-110" : "bg-white/5")}>
                        <UploadCloud className={cn("h-8 w-8", dragActive ? "text-fuchsia-400" : "text-slate-400")} />
                    </div>
                    <p className="text-sm font-bold text-slate-300">
                        {dragActive ? "Solte as fotos ou vídeos aqui" : "Arraste e solte fotos/vídeos ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-slate-500">
                        Apenas JPG, PNG e MP4
                    </p>
                </div>
            </div>

            {/* Galeria de Mídia */}
            {mediaList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {mediaList.map((media) => (
                        <div key={media.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-white/10 hover:border-fuchsia-500/50 transition-all cursor-pointer">
                            {media.type.startsWith('video') ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                                    <FileVideo className="h-10 w-10 text-slate-500 group-hover:text-fuchsia-400 group-hover:scale-110 transition-all" />
                                </div>
                            ) : (
                                <img
                                    src={media.url}
                                    alt={media.filename}
                                    className="object-cover w-full h-full opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                />
                            )}

                            {/* Overlay info */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
                                <p className="text-[10px] text-white truncate font-medium">{media.filename}</p>
                            </div>

                            {/* Type badge */}
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md rounded-lg p-1.5">
                                {media.type.startsWith('video') ? <FileVideo className="h-3 w-3 text-white" /> : <ImageIcon className="h-3 w-3 text-white" />}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex justify-center items-center h-32 text-slate-500 text-sm italic">
                    Nenhuma mídia de comprovação enviada ainda.
                </div>
            )}
        </Card>
    );
}
