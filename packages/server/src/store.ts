import { makeAdapter } from '@livestore/adapter-node'
import { makeCfSync } from '@livestore/sync-cf'

const SYNC_URL = process.env.LIVESTORE_SYNC_URL || 'ws://localhost:8787'

export const adapter = makeAdapter({
  storage: {
    type: 'fs',
    baseDirectory: './data',
  },
  sync: {
    backend: makeCfSync({ url: SYNC_URL }),
    onSyncError: 'shutdown', // Shutdown on sync errors
  },
})

// Export for use in index.ts
export { schema, events, tables } from '@work-squared/shared/schema'
