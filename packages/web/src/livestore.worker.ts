import { makeWorker } from '@livestore/adapter-web/worker'
import { makeCfSync } from '@livestore/sync-cf'

import { schema } from '@work-squared/shared/schema'
import { makeTracer } from './otel.js'

const getSyncUrl = () => {
  if (import.meta.env.PROD) {
    // In production the worker is served from the same origin as the site.
    // We only need to provide the base host, as makeCfSync appends the path.
    return `wss://${self.location.host}`
  }
  // In development, we use the URL provided by the .env file.
  return import.meta.env.VITE_LIVESTORE_SYNC_URL
}

makeWorker({
  schema,
  sync: {
    backend: makeCfSync({ url: getSyncUrl() }),
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
  otelOptions: { tracer: makeTracer('work-squared-worker') },
})
