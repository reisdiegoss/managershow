import { Database } from '@nozbe/watermelondb'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import schema from './schema'
import Show from './models/Show'
import LogisticsTimeline from './models/LogisticsTimeline'
import ShowCheckin from './models/ShowCheckin'
import FinancialTransaction from './models/FinancialTransaction'

const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false, // Recomendado para Next.js por simplicidade inicial
    useIncrementalIndexedDB: true,
})

export const database = new Database({
    adapter,
    modelClasses: [
        Show,
        LogisticsTimeline,
        ShowCheckin,
        FinancialTransaction,
    ],
})
