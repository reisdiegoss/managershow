"use client"

import React, { useState, useRef } from 'react'
import { Camera, Upload, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import axios from 'axios'

interface ReceiptCaptureProps {
    onSuccess: (url: string) => void
    onCancel: () => void
}

export function ReceiptCapture({ onSuccess, onCancel }: ReceiptCaptureProps) {
    const [photo, setPhoto] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const { toast } = useToast()

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
        } catch (err) {
            toast({
                title: "Erro na Câmera",
                description: "Não foi possível acessar a câmera.",
                variant: "destructive"
            })
        }
    }

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d')
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth
                canvasRef.current.height = videoRef.current.videoHeight
                context.drawImage(videoRef.current, 0, 0)

                const dataUrl = canvasRef.current.toDataURL('image/jpeg')
                setPhoto(dataUrl)

                // Parar stream
                const stream = videoRef.current.srcObject as MediaStream
                stream.getTracks().forEach(track => track.stop())

                // Converter dataUrl para File
                fetch(dataUrl)
                    .then(res => res.blob())
                    .then(blob => {
                        const f = new File([blob], "receipt.jpg", { type: "image/jpeg" })
                        setFile(f)
                    })
            }
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)

        const formData = new FormData()
        formData.append('file', file)

        try {
            // Endpoint criado na Fase 28
            const res = await axios.post('/api/v1/client/receipts/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            onSuccess(res.data.url)
            toast({
                title: "Sucesso!",
                description: "Recibo enviado com sucesso.",
            })
        } catch (err) {
            toast({
                title: "Erro no Upload",
                description: "Falha ao enviar recibo para o servidor.",
                variant: "destructive"
            })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="flex flex-col items-center gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800">
            {!photo ? (
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden ring-1 ring-slate-700">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                        <Button size="icon" variant="secondary" onClick={startCamera} title="Ligar Câmera">
                            <Camera className="w-5 h-5" />
                        </Button>
                        <Button size="icon" onClick={takePhoto} className="bg-amber-500 hover:bg-amber-600 rounded-full w-12 h-12">
                            <div className="w-8 h-8 rounded-full border-4 border-white" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden shadow-2xl">
                    <img src={photo} className="w-full h-full object-contain" alt="Recibo capturado" />
                    <div className="absolute top-2 right-2">
                        <Button size="icon" variant="destructive" onClick={() => setPhoto(null)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2 w-full">
                <Button variant="ghost" className="flex-1" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    disabled={!photo || uploading}
                    onClick={handleUpload}
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <Check className="w-4 h-4 mr-2" />
                    )}
                    Confirmar & Sincronizar
                </Button>
            </div>
        </div>
    )
}
