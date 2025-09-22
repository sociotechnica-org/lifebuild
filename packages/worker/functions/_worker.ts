import { makeDurableObject, makeWorker } from '@livestore/sync-cf/cf-worker'

export class WebSocketServer extends makeDurableObject({
  onPush: async (message, context) => {
    console.log('onPush', message.batch.length, 'events', 'storeId:', context.storeId, 'payload:', context.payload)
  },
  onPull: async (message, context) => {
    console.log('onPull', message, 'storeId:', context.storeId, 'payload:', context.payload)
  },
}) {}

export default makeWorker({
  validatePayload: (payload: any, context) => {
    console.log(`Validating connection for store: ${context.storeId}`, 'payload:', payload)

    // Simple validation - accept both dev token and valid JWT for now
    if (payload?.authToken === 'insecure-token-change-me') {
      console.log('Accepted insecure dev token')
      return
    }

    // For now, accept any JWT-looking token (starts with ey)
    if (payload?.authToken && typeof payload.authToken === 'string' && payload.authToken.startsWith('ey')) {
      console.log('Accepted JWT token')
      return
    }

    throw new Error('Invalid auth token')
  },
  enableCORS: true,
})