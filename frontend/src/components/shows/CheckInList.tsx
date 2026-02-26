"use client"

import React, { useState } from 'react'
import { CheckCircle2, Circle, Loader2, UserCheck, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { database } from '@/lib/db'
import { sync } from '@/lib/db/syncService'
import { Q } from '@nozbe/watermelondb'
import withObservables from '@nozbe/with-observables'
import ShowCheckin from '@/lib/db/models/ShowCheckin'
import { useToast } from '@/components/ui/use-toast'
import { useApi } from '@/lib/api'

interface CheckInListProps {
    showId: string
    checkins: ShowCheckin[]
}

const BaseCheckInList = ({ showId, checkins }: CheckInListProps) => {
    const { toast } = useToast()
    const { api } = useApi()
    const [isSyncing, setIsSyncing] = useState(false)
    const [isOffline, setIsOffline] = useState(!navigator.onLine)

    // Monitoramento simples de rede para UI Feedback (pode ser movido para hook global depois)
    React.useEffect(() => {
        const handleOnline = () => setIsOffline(false)
        const handleOffline = () => setIsOffline(true)
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const handleSync = async () => {
        if (isOffline) {
            toast({
                title: "Sem conexão",
                description: "Não é possível sincronizar enquanto estiver offline.",
                variant: "destructive"
            })
            return
        }

        setIsSyncing(true)
        try {
            await sync(api)
            toast({
                title: "Sincronizado",
                description: "Dados enviados para a nuvem.",
            })
        } catch (err) {
            toast({
                title: "Erro de Sincronização",
                description: "Tente novamente mais tarde.",
                variant: "destructive"
            })
        } finally {
            setIsSyncing(false)
        }
    }

    const toggleCheckIn = async (userId: string, currentStatus: boolean) => {
        try {
            await database.write(async () => {
                if (currentStatus) {
                    // Remover check-in
                    const existing = checkins.find(c => c.userId === userId)
                    if (existing) {
                        await existing.markAsDeleted() // Destruição lógica para sincronização
                    }
                } else {
                    // Criar novo check-in
                    await database.get<ShowCheckin>('show_checkins').create(record => {
                        record.showId = showId
                        record.userId = userId
                        record.checkedInAt = Date.now()
                        record.dynamicData = JSON.stringify({ source: 'mobile_offline' })
                    })
                }
            })

            toast({
                title: currentStatus ? "Saída Registrada" : "Presença Confirmada (Offline)",
                description: "Status atualizado localmente. Será sincronizado.",
            })
        } catch (err) {
            toast({
                title: "Erro no Check-in",
                description: "Não foi possível salvar a alteração.",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-500" />
                    <h3 className="font-black uppercase tracking-tighter text-lg italic">
                        Check-in <span className="text-slate-400">da Equipe</span>
                    </h3>
                </div>

                <div className="flex items-center gap-2">
                    {/* Status de Rede */}
                    <div className={`p-2 rounded-full ${isOffline ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                        {isOffline ? <WifiOff className="w-4 h-4 text-rose-500" /> : <Wifi className="w-4 h-4 text-emerald-500" />}
                    </div>
                    {/* Botão de Sync Manual */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSync}
                        disabled={isSyncing || isOffline}
                        className="rounded-full shadow-sm text-xs font-bold uppercase"
                    >
                        <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync {checkins.length > 0 && `(${checkins.length})`}
                    </Button>
                </div>
            </div>

            <div className="grid gap-2">
                {/* Mock de equipe para demonstração - em produção viria de ArtistCrew */}
                {['Técnico de Som', 'Roadie 1', 'Músico — Teclados'].map((role, idx) => {
                    const userId = `user-${idx}` // Mock ID
                    const isCheckedIn = checkins.some(c => c.userId === userId)

                    return (
                        <div
                            key={userId}
                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${isCheckedIn ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-100 bg-white'
                                }`}
                        >
                            <div>
                                <p className="font-black text-sm uppercase italic tracking-tight text-slate-900">{role}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    {isCheckedIn ? 'Presença Confirmada' : 'Aguardando Chegada'}
                                </p>
                            </div>

                            <Button
                                size="icon"
                                variant={isCheckedIn ? "default" : "outline"}
                                className={`rounded-full w-10 h-10 transition-all ${isCheckedIn ? 'bg-emerald-600' : ''}`}
                                onClick={() => toggleCheckIn(userId, isCheckedIn)}
                            >
                                {isCheckedIn ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </Button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// O componente se inscreve na query para ser re-renderizado sempre que os dados mudarem
export const CheckInList = withObservables(['showId'], ({ showId }: { showId: string }) => ({
    checkins: database.get<ShowCheckin>('show_checkins').query(
        Q.where('show_id', showId)
    )
}))(BaseCheckInList)
