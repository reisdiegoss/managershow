"use client"

import React, { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { database } from '@/lib/db'
import { Q } from '@nozbe/watermelondb'
import ShowCheckin from '@/lib/db/models/ShowCheckin'
import { useToast } from '@/components/ui/use-toast'

interface CheckInListProps {
    showId: string
}

export function CheckInList({ showId }: CheckInListProps) {
    const [checkins, setCheckins] = useState<ShowCheckin[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    // Busca inicial e observação de mudanças locais
    useEffect(() => {
        const query = database.get<ShowCheckin>('show_checkins').query(
            Q.where('show_id', showId)
        )

        const subscription = query.observe().subscribe(data => {
            setCheckins(data)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [showId])

    const toggleCheckIn = async (userId: string, currentStatus: boolean) => {
        try {
            if (currentStatus) {
                // Remover check-in
                const existing = checkins.find(c => c.userId === userId)
                if (existing) {
                    await database.write(async () => {
                        await existing.markAsDeleted() // Destruição lógica para sincronização
                    })
                }
            } else {
                // Criar novo check-in
                await database.write(async () => {
                    await database.get<ShowCheckin>('show_checkins').create(record => {
                        record.showId = showId
                        record.userId = userId
                        record.checkedInAt = Date.now()
                        record.dynamicData = JSON.stringify({ source: 'mobile_offline' })
                    })
                })
            }

            toast({
                title: currentStatus ? "Saída Registrada" : "Presença Confirmada",
                description: "Status atualizado localmente.",
            })
        } catch (err) {
            toast({
                title: "Erro no Check-in",
                description: "Não foi possível salvar a alteração.",
                variant: "destructive"
            })
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-6">
                <UserCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-black uppercase tracking-tighter text-lg italic">
                    Check-in <span className="text-slate-400">da Equipe</span>
                </h3>
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
