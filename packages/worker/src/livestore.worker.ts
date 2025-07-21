import { makeWorker } from '@livestore/adapter-web/worker'
import { makeCfSync } from '@livestore/sync-cf'

import { schema } from '@work-squared/shared/schema'
import { makeTracer } from './otel.js'

const getSyncUrl = () => {
  // For development, always use the local wrangler instance
  // In a worker context, check if we're in development mode
  if (self.location && self.location.hostname === 'localhost') {
    return 'ws://localhost:8787'
  }
  // In production the worker is served from the same origin as the site.
  // We only need to provide the base host, as makeCfSync appends the path.
  return `wss://${self.location.host}`
}

makeWorker({
  schema,
  sync: {
    backend: makeCfSync({ url: getSyncUrl() }),
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
  otelOptions: { tracer: makeTracer('work-squared-worker') },
})
