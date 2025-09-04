#!/usr/bin/env tsx
/**
 * Cron job script to process recurring tasks
 *
 * This script is designed to be run every 5 minutes via Render cron jobs.
 * It connects to all configured stores, checks for due tasks, and executes them.
 *
 * Schedule: every 5 minutes
 * Command: pnpm --filter @work-squared/server run process-tasks
 */

import { StoreManager } from '../services/store-manager.js'
import { TaskScheduler } from '../services/task-scheduler.js'
import { parseStoreIds } from '../config/stores.js'

async function main(): Promise<void> {
  const startTime = Date.now()
  console.log(`🚀 Starting recurring task processing at ${new Date().toISOString()}`)

  let storeManager: StoreManager | null = null
  let taskScheduler: TaskScheduler | null = null

  try {
    // Parse store IDs from environment
    const storeIds = parseStoreIds(process.env.STORE_IDS)

    if (storeIds.length === 0) {
      console.log('⚠️  No stores configured, exiting')
      process.exit(0)
    }

    console.log(`📋 Processing tasks for ${storeIds.length} stores: ${storeIds.join(', ')}`)

    // Initialize store manager and connect to all stores
    storeManager = new StoreManager()
    await storeManager.initialize(storeIds)

    // Initialize task scheduler
    taskScheduler = new TaskScheduler()
    await taskScheduler.initialize()

    // Get stats before processing
    const statsBefore = await taskScheduler.getStats()
    console.log(`📊 Starting stats: ${statsBefore.processedExecutions} total executions processed`)

    // Process tasks for each store
    let totalTasksProcessed = 0
    const stores = storeManager.getAllStores()

    for (const [storeId, store] of stores) {
      try {
        console.log(`\n🔍 Processing store: ${storeId}`)
        await taskScheduler.checkAndExecuteTasks(storeId, store)

        // Update activity timestamp
        storeManager.updateActivity(storeId)
        totalTasksProcessed++
      } catch (error) {
        console.error(`❌ Failed to process tasks for store ${storeId}:`, error)
        // Continue with other stores
      }
    }

    // Get stats after processing
    const statsAfter = await taskScheduler.getStats()
    const newExecutions = statsAfter.processedExecutions - statsBefore.processedExecutions

    const duration = Date.now() - startTime
    console.log(`\n✅ Task processing completed in ${duration}ms`)
    console.log(`📊 Processed ${totalTasksProcessed} stores`)
    console.log(`📊 New executions: ${newExecutions}`)
    console.log(`📊 Total executions: ${statsAfter.processedExecutions}`)
  } catch (error) {
    console.error('❌ Fatal error during task processing:', error)
    process.exit(1)
  } finally {
    // Clean up resources
    try {
      if (taskScheduler) {
        await taskScheduler.close()
      }
      if (storeManager) {
        await storeManager.shutdown()
      }
    } catch (error) {
      console.error('⚠️  Error during cleanup:', error)
    }
  }

  console.log('🏁 Process complete, exiting')
  process.exit(0)
}

// Handle graceful shutdown
function setupGracefulShutdown() {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'] as const

  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`)

      // Give processes 10 seconds to clean up
      setTimeout(() => {
        console.log('⏰ Forced exit after timeout')
        process.exit(1)
      }, 10000)

      // The main function handles cleanup in its finally block
      process.exit(0)
    })
  })
}

// Handle unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

process.on('uncaughtException', error => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Export for testing
export { main, setupGracefulShutdown }

// Only run if this is the main module (not being imported for tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  // Setup and run
  setupGracefulShutdown()

  // Add environment validation
  const requiredEnvVars = ['BRAINTRUST_API_KEY', 'BRAINTRUST_PROJECT_ID']
  const missingEnvVars = requiredEnvVars.filter(name => !process.env[name])

  if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`)
    process.exit(1)
  }

  // Run the main function
  main().catch(error => {
    console.error('❌ Unhandled error in main:', error)
    process.exit(1)
  })
}
