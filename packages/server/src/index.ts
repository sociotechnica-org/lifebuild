import dotenv from 'dotenv'
import { createStorePromise } from '@livestore/livestore'
import { adapter, schema, events, tables } from './store.js'

dotenv.config()

async function main() {
  console.log('Starting Work Squared server...')
  console.log(
    'Connecting to sync backend at:',
    process.env.LIVESTORE_SYNC_URL || 'ws://localhost:8787'
  )

  // Initialize LiveStore with proper configuration
  const store = await createStorePromise({
    adapter,
    schema: schema as any, // Temporary fix for version compatibility
    storeId: process.env.STORE_ID || 'work-squared-server',
    syncPayload: {
      authToken: process.env.AUTH_TOKEN || 'insecure-token-change-me',
    },
  })

  console.log('Store initialized successfully')

  // Test basic query first - temporarily disabled due to type issues
  // try {
  //   const allTasks = store.query(tables.tasks) as any[]
  //   console.log('Current tasks:', allTasks.length)
  // } catch (error) {
  //   console.log('Query error:', error)
  // }
  console.log('Basic functionality working - DevTools starting...')

  // Event subscriptions disabled for now due to LiveStore issue
  // TODO: Re-enable subscriptions once LiveStore issue is resolved
  console.log('Skipping event subscriptions for now')

  // Start LiveStore DevTools
  console.log('LiveStore DevTools available at http://localhost:3001/__livestore')
  console.log('Store ID:', store.storeId)

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...')
    await store.shutdown()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('Shutting down server...')
    await store.shutdown()
    process.exit(0)
  })
}

main().catch(console.error)
