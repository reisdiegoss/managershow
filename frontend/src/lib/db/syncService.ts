import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from './index'

/**
 * Orquestra a sincronização entre o banco local (WatermelonDB) 
 * e o backend (FastAPI).
 * 
 * @param api Instância do axios configurada com o token de autenticação
 */
export async function sync(api: any) {
    try {
        await synchronize({
            database,
            pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
                const response = await api.get('/sync/pull', {
                    params: { last_pulled_at: lastPulledAt },
                })

                if (response.status !== 200) {
                    throw new Error('Falha no Pull: Erro de rede ou servidor')
                }

                const { changes, timestamp } = response.data
                return { changes, timestamp }
            },
            pushChanges: async ({ changes, lastPulledAt }) => {
                const response = await api.post('/sync/push', {
                    changes,
                    last_pulled_at: lastPulledAt,
                })

                if (response.status !== 200) {
                    throw new Error('Falha no Push: Erro de rede ou servidor')
                }
            },
            migrationsEnabledAtVersion: 1,
        })
        console.log('Sincronização concluída com sucesso.')
    } catch (error) {
        console.error('Erro na sincronização:', error)
        throw error // Re-throw para ser tratado pela UI (toast, etc)
    }
}
