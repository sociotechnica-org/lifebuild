import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'

export class WebSocketServer extends makeDurableObject({
  onPush: async function (message) {
    console.log('Sync server: relaying', message.batch.length, 'events')

    // Just log event types for debugging - no processing
    for (const event of message.batch) {
      console.log(`Syncing event: ${event.name} (${event.args.role || 'no role'})`)
    }
  },
  onPull: async function (message) {
    console.log('onPull', message)
  },
}) {}

export default makeWorker({
  validatePayload: (payload: any) => {
    if (payload?.authToken !== 'insecure-token-change-me') {
      throw new Error('Invalid auth token')
    }
  },
  enableCORS: true,
})
