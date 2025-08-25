/**
 * Minimal Cloudflare Worker sync server for reproducing Node/Web adapter issue
 * Based on LiveStore documentation
 */

import { makeCfWorker, WebSocketServer } from '@livestore/sync-cf'

export { WebSocketServer }

export default makeCfWorker({
  // Simple auth - accept any token
  authenticateStoreAccess: async (payload: any) => {
    return {
      result: 'success' as const,
      userId: 'test-user',
    }
  },
})