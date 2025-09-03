import { describe, expect, beforeEach, afterEach, test } from 'vitest'
import fs from 'fs'
import path from 'path'

// Check if better-sqlite3 is available
let canUseSqlite = true
let ProcessedMessageTracker: any = null

try {
  // This will fail if better-sqlite3 binaries aren't compiled
  require('better-sqlite3')
} catch {
  canUseSqlite = false
  console.warn('⚠️ Skipping ProcessedMessageTracker tests: better-sqlite3 not available')
}

describe('ProcessedMessageTracker', () => {
  let tracker: any
  const testDataPath = './test-data'
  const testDbPath = path.join(testDataPath, 'processed-messages.db')

  beforeEach(async () => {
    if (!canUseSqlite) return

    const trackerModule = await import('./processed-message-tracker.js')
    ProcessedMessageTracker = trackerModule.ProcessedMessageTracker
    // Clean up any existing test db and directory
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true })
    }

    // Create test directory
    fs.mkdirSync(testDataPath, { recursive: true })

    tracker = new ProcessedMessageTracker(testDataPath)
    await tracker.initialize()
  })

  afterEach(async () => {
    await tracker.close()

    // Clean up test files
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
    if (fs.existsSync(testDataPath)) {
      fs.rmSync(testDataPath, { recursive: true, force: true })
    }
  })

  test.skipIf(!canUseSqlite)('should initialize database and create table', async () => {
    // If we get here without throwing, initialization worked
    expect(tracker).toBeDefined()
    expect(fs.existsSync(testDbPath)).toBe(true)
  })

  test.skipIf(!canUseSqlite)('should track processed messages correctly', async () => {
    const messageId = 'msg-123'
    const storeId = 'store-abc'

    // Should not be processed initially
    expect(await tracker.isProcessed(messageId, storeId)).toBe(false)

    // Mark as processed
    const wasNew = await tracker.markProcessed(messageId, storeId)
    expect(wasNew).toBe(true)

    // Should now be processed
    expect(await tracker.isProcessed(messageId, storeId)).toBe(true)

    // Marking again should return false (already exists)
    const wasNewAgain = await tracker.markProcessed(messageId, storeId)
    expect(wasNewAgain).toBe(false)
  })

  test.skipIf(!canUseSqlite)('should handle different store IDs separately', async () => {
    const messageId = 'msg-123'
    const storeId1 = 'store-a'
    const storeId2 = 'store-b'

    // Mark as processed in first store
    await tracker.markProcessed(messageId, storeId1)

    // Should be processed in store A but not store B
    expect(await tracker.isProcessed(messageId, storeId1)).toBe(true)
    expect(await tracker.isProcessed(messageId, storeId2)).toBe(false)

    // Mark in store B
    await tracker.markProcessed(messageId, storeId2)
    expect(await tracker.isProcessed(messageId, storeId2)).toBe(true)
  })

  test.skipIf(!canUseSqlite)(
    'should persist across tracker instances (simulating server restart)',
    async () => {
      const messageId = 'msg-persistent'
      const storeId = 'store-test'

      // Mark as processed with first instance
      const wasNew = await tracker.markProcessed(messageId, storeId)
      expect(wasNew).toBe(true)
      expect(await tracker.isProcessed(messageId, storeId)).toBe(true)

      await tracker.close()

      // Create new tracker instance (simulating restart)
      const tracker2 = new ProcessedMessageTracker(testDataPath)
      await tracker2.initialize()

      // Should remember it was already processed
      expect(await tracker2.isProcessed(messageId, storeId)).toBe(true)

      // Attempting to mark again should return false (already exists)
      const wasNewAgain = await tracker2.markProcessed(messageId, storeId)
      expect(wasNewAgain).toBe(false)

      await tracker2.close()
    }
  )

  test.skipIf(!canUseSqlite)('should handle concurrent processing attempts', async () => {
    const messageId = 'msg-concurrent'
    const storeId = 'store-test'

    // Simulate two instances trying to process the same message
    const [result1, result2] = await Promise.all([
      tracker.markProcessed(messageId, storeId),
      tracker.markProcessed(messageId, storeId),
    ])

    // Exactly one should succeed
    expect(result1 !== result2).toBe(true) // One true, one false
    expect(result1 || result2).toBe(true) // At least one succeeded

    // Both should see it as processed
    expect(await tracker.isProcessed(messageId, storeId)).toBe(true)
  })

  test.skipIf(!canUseSqlite)('should count processed messages correctly', async () => {
    const storeId = 'store-test'

    // Initially should have 0
    expect(await tracker.getProcessedCount()).toBe(0)
    expect(await tracker.getProcessedCount(storeId)).toBe(0)

    // Add some messages
    await tracker.markProcessed('msg-1', storeId)
    await tracker.markProcessed('msg-2', storeId)
    await tracker.markProcessed('msg-3', 'other-store')

    // Check counts
    expect(await tracker.getProcessedCount()).toBe(3) // Total
    expect(await tracker.getProcessedCount(storeId)).toBe(2) // Just this store
    expect(await tracker.getProcessedCount('other-store')).toBe(1)
  })

  test.skipIf(!canUseSqlite)('should provide database path', () => {
    expect(tracker.databasePath).toBe(testDbPath)
  })

  test.skipIf(!canUseSqlite)('should handle initialization errors gracefully', async () => {
    // Try to initialize with invalid path
    const badTracker = new ProcessedMessageTracker('/invalid/path/that/does/not/exist')

    await expect(badTracker.initialize()).rejects.toThrow()
  })

  test.skipIf(!canUseSqlite)('should handle database operations when not initialized', async () => {
    const uninitializedTracker = new ProcessedMessageTracker(testDataPath)
    // Don't call initialize()

    await expect(uninitializedTracker.isProcessed('msg', 'store')).rejects.toThrow(
      'Database not initialized'
    )
    await expect(uninitializedTracker.markProcessed('msg', 'store')).rejects.toThrow(
      'Database not initialized'
    )
  })
})
