import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'
import { schema } from './schema'

console.log('🚀 LiveStore worker starting...')

const syncUrl = 'ws://localhost:8787'
console.log('📡 Sync URL:', syncUrl)

makeWorker({
  schema,
  sync: {
    backend: makeWsSync({ url: syncUrl }),
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
})

console.log('✅ LiveStore worker initialized')