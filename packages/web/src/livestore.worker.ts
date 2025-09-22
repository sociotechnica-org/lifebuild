import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'

import { schema } from '@work-squared/shared/schema'
import { makeTracer } from './otel.js'

const getSyncUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_LIVESTORE_SYNC_URL) {
    return import.meta.env.VITE_LIVESTORE_SYNC_URL
  }

  // Fallback to localhost for development
  if (self.location && self.location.hostname === 'localhost') {
    return 'ws://localhost:8787'
  }

  // Production fallback
  return `wss://${self.location.host}`
}

makeWorker({
  schema,
  sync: {
    backend: makeWsSync({ url: getSyncUrl() }),
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
  otelOptions: { tracer: makeTracer('work-squared-worker') },
})
