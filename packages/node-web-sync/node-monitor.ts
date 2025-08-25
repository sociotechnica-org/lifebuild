#!/usr/bin/env node

/**
 * Node.js monitor using node adapter
 * This should receive events from the web client but crashes with materializer hash mismatch
 */

import { createStorePromise, queryDb } from '@livestore/livestore'
import { makeAdapter } from '@livestore/adapter-node'
import { makeCfSync } from '@livestore/sync-cf'
import { schema, tables } from './schema.js'

const STORE_ID = 'test-store'
const SYNC_URL = 'ws://localhost:8787'

async function main() {
  console.log('🖥️  Starting Node Monitor (using node adapter)')
  console.log(`📦 Store ID: ${STORE_ID}`)
  
  // Use node adapter (different from web client)
  const adapter = makeAdapter({
    storage: {
      type: 'fs',
      baseDirectory: './data',
    },
    sync: {
      backend: makeCfSync({ url: SYNC_URL }),
      onSyncError: (error) => {
        console.error('❌ Sync error:', error)
        console.error('   This is likely the materializer hash mismatch!')
        return 'retry'
      },
    },
  })

  console.log('📡 Creating store...')
  
  try {
    const store = await createStorePromise({
      adapter,
      schema,
      storeId: STORE_ID,
      syncPayload: { authToken: 'test-token' },
    })

    console.log('✅ Node monitor connected')
    
    // Monitor for shutdown
    const originalShutdown = store.shutdown.bind(store)
    store.shutdown = async (cause?: any) => {
      console.error('⚠️ STORE SHUTDOWN CALLED!')
      console.error('   Cause:', cause)
      console.error('   Stack:', new Error().stack)
      return originalShutdown(cause)
    }
    
    // Create a query for all messages using table reference
    const messagesQuery = queryDb(
      tables.messages.select(),
      { label: 'getAllMessages' }
    )
    
    // Subscribe to messages to see what we receive  
    const unsubscribe = store.subscribe(messagesQuery, {
      onUpdate: (messages: any[]) => {
        console.log(`📨 Received ${messages.length} messages:`)
        for (const msg of messages) {
          console.log(`   - ${msg.id}: ${msg.text}`)
        }
      }
    })
    
    console.log('👂 Monitoring for messages from web client...')
    console.log('🔍 Expected behavior: Should receive events created by web client')
    console.log('❌ Actual behavior: Will likely shutdown with materializer hash mismatch')
    
    // Keep running
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping node monitor...')
      unsubscribe()
      store.shutdown()
      process.exit(0)
    })
    
  } catch (error) {
    console.error('❌ Failed to start node monitor:', error)
    process.exit(1)
  }
}

main().catch(console.error)