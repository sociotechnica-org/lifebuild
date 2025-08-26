#!/usr/bin/env node

/**
 * Web client simulator using web adapter
 * This creates events that should be seen by the node monitor
 */

import { createStorePromise } from '@livestore/livestore'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { makeCfSync } from '@livestore/sync-cf'
import { schema, events } from './schema.js'

const STORE_ID = 'test-store'
const SYNC_URL = 'ws://localhost:8787'

async function main() {
  console.log('🌐 Starting Web Client (using web adapter)')
  console.log(`📦 Store ID: ${STORE_ID}`)
  
  // Use web adapter (like browser would)
  const adapter = makeInMemoryAdapter({
    sync: {
      backend: makeCfSync({ url: SYNC_URL }),
    },
  })

  const store = await createStorePromise({
    adapter,
    schema,
    storeId: STORE_ID,
    syncPayload: { authToken: 'test-token' },
  })

  console.log('✅ Web client connected')
  
  // Create some test events
  let counter = 0
  const createMessage = () => {
    counter++
    const event = events.messageCreated({
      id: `msg-${counter}`,
      text: `Hello from web client ${counter}`,
      timestamp: new Date().toISOString(),
    })
    
    store.commit(event)
    console.log(`📝 Created message ${counter}`)
  }

  // Create initial message
  createMessage()
  
  // Create a message every 5 seconds
  const interval = setInterval(createMessage, 5000)
  
  console.log('🔄 Creating messages every 5 seconds...')
  console.log('Press Ctrl+C to stop')
  
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping web client...')
    clearInterval(interval)
    store.shutdown()
    process.exit(0)
  })
}

main().catch(console.error)