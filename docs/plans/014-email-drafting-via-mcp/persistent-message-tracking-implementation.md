# Persistent Message Tracking Implementation Plan

## Overview

Implement SQLite-based persistent tracking of processed chat message IDs to prevent expensive duplicate LLM processing during server restarts and deployments.

**Reference**: See ADR-007 for full analysis and alternatives considered.

## Architecture Summary

```
Server Instance A/B → SQLite DB (Attached Disk) → Atomic Operations
                   ↘                           ↙
                     processed_messages table
                     - Prevents race conditions
                     - Survives deployments
                     - Handles overlapping instances
```

## Implementation Phases

### Phase 1: SQLite Infrastructure

**Goal**: Add SQLite database and core tracking functionality

#### 1.1 Add Dependencies

```bash
cd packages/server
pnpm add sqlite3 @types/sqlite3
```

#### 1.2 Create ProcessedMessageTracker Class

**File**: `packages/server/src/services/processed-message-tracker.ts`

```typescript
import sqlite3 from 'sqlite3'
import { promisify } from 'util'
import path from 'path'

export class ProcessedMessageTracker {
  private db: sqlite3.Database | null = null
  private dbPath: string

  constructor(dataPath?: string) {
    const basePath = dataPath || process.env.STORE_DATA_PATH || './data'
    this.dbPath = path.join(basePath, 'processed-messages.db')
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, err => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`))
          return
        }

        // Enable WAL mode for better concurrent access
        this.db!.run('PRAGMA journal_mode=WAL', err => {
          if (err) {
            reject(new Error(`Failed to enable WAL mode: ${err.message}`))
            return
          }

          this.createTable()
            .then(() => resolve())
            .catch(reject)
        })
      })
    })
  }

  private async createTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS processed_messages (
        id TEXT NOT NULL,
        store_id TEXT NOT NULL,
        processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, store_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_store_processed 
      ON processed_messages (store_id, processed_at);
    `

    return new Promise((resolve, reject) => {
      this.db!.exec(sql, err => {
        if (err) {
          reject(new Error(`Failed to create table: ${err.message}`))
        } else {
          console.log('✅ Processed messages database initialized')
          resolve()
        }
      })
    })
  }

  async isProcessed(messageId: string, storeId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT 1 FROM processed_messages WHERE id = ? AND store_id = ?',
        [messageId, storeId],
        (err, row) => {
          if (err) {
            reject(new Error(`Database query failed: ${err.message}`))
          } else {
            resolve(row !== undefined)
          }
        }
      )
    })
  }

  async markProcessed(messageId: string, storeId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized')

    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT OR IGNORE INTO processed_messages (id, store_id) VALUES (?, ?)',
        [messageId, storeId],
        function (err) {
          if (err) {
            reject(new Error(`Failed to mark processed: ${err.message}`))
          } else {
            // this.changes > 0 means we won the race (successfully inserted)
            resolve(this.changes > 0)
          }
        }
      )
    })
  }

  async getProcessedCount(storeId?: string): Promise<number> {
    if (!this.db) return 0

    const sql = storeId
      ? 'SELECT COUNT(*) as count FROM processed_messages WHERE store_id = ?'
      : 'SELECT COUNT(*) as count FROM processed_messages'
    const params = storeId ? [storeId] : []

    return new Promise((resolve, reject) => {
      this.db!.get(sql, params, (err, row: any) => {
        if (err) {
          reject(new Error(`Failed to get count: ${err.message}`))
        } else {
          resolve(row?.count || 0)
        }
      })
    })
  }

  async close(): Promise<void> {
    if (!this.db) return

    return new Promise(resolve => {
      this.db!.close(err => {
        if (err) {
          console.error('Error closing database:', err.message)
        }
        resolve()
      })
    })
  }
}
```

#### 1.3 Update Event Processor

**File**: `packages/server/src/services/event-processor.ts`

Add to imports:

```typescript
import { ProcessedMessageTracker } from './processed-message-tracker.js'
```

Add to class properties:

```typescript
export class EventProcessor {
  private processedTracker: ProcessedMessageTracker

  constructor(storeManager: StoreManager) {
    // ... existing code
    this.processedTracker = new ProcessedMessageTracker()
  }
}
```

Add initialization to constructor:

```typescript
constructor(storeManager: StoreManager) {
  // ... existing code

  // Initialize processed message tracking
  this.processedTracker.initialize().catch(error => {
    console.error('❌ Failed to initialize processed message tracker:', error)
    // Continue without persistent tracking - will fall back to in-memory
  })
}
```

#### 1.4 Test Database Initialization

Add basic health check to verify SQLite works:

**File**: `packages/server/src/services/processed-message-tracker.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ProcessedMessageTracker } from './processed-message-tracker.js'
import fs from 'fs'

describe('ProcessedMessageTracker', () => {
  let tracker: ProcessedMessageTracker
  const testDbPath = './test-processed-messages.db'

  beforeEach(async () => {
    // Clean up any existing test db
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }

    tracker = new ProcessedMessageTracker('./test-data')
    await tracker.initialize()
  })

  afterEach(async () => {
    await tracker.close()
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath)
    }
  })

  it('should initialize database and create table', async () => {
    // If we get here without throwing, initialization worked
    expect(tracker).toBeDefined()
  })

  it('should track processed messages correctly', async () => {
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
})
```

**Deliverable**: SQLite infrastructure working with basic tests passing

### Phase 2: Integration with Message Processing

**Goal**: Replace in-memory Set with SQLite for actual message processing

#### 2.1 Update startMonitoring Method

Replace the in-memory pre-population with SQLite initialization:

```typescript
async startMonitoring(storeId: string, store: LiveStore): Promise<void> {
  console.log(`📡 Starting comprehensive event monitoring for store ${storeId}`)

  // ... existing state setup ...

  // Remove: Pre-populate processedMessageIds with existing user messages
  // The SQLite database will handle persistence across restarts

  console.log(`📝 Using persistent message tracking for store ${storeId}`)

  // Monitor all important tables
  for (const tableName of this.monitoredTables) {
    this.setupTableSubscription(storeId, store, tableName, storeState)
  }
}
```

#### 2.2 Update Message Processing Logic

Replace the in-memory Set checks with SQLite:

```typescript
// In handleTableUpdate method:
if (tableName === 'chatMessages' && recordObj.role === 'user') {
  // Check if already processed using SQLite
  const isAlreadyProcessed = await this.processedTracker.isProcessed(recordObj.id, storeId)

  if (isAlreadyProcessed) {
    console.log(`⏭️ Skipping already-processed message: ${recordObj.id}`)
    continue
  }

  // Attempt to claim processing rights atomically
  const claimedProcessing = await this.processedTracker.markProcessed(recordObj.id, storeId)

  if (!claimedProcessing) {
    console.log(`🏁 Another instance claimed processing for message: ${recordObj.id}`)
    continue
  }

  console.log(`🆕 Claimed processing rights for message: ${recordObj.id}`)

  // Defer processing to avoid committing during reactive update cycle
  setImmediate(() => {
    this.handleUserMessage(storeId, recordObj as ChatMessage, storeState)
  })
}
```

#### 2.3 Remove In-Memory processedMessageIds

Clean up the old implementation:

- Remove `processedMessageIds: Set<string>` from `StoreProcessingState`
- Remove Set initialization and management code

#### 2.4 Add Error Handling

```typescript
// Wrap SQLite operations with error handling
try {
  const isAlreadyProcessed = await this.processedTracker.isProcessed(recordObj.id, storeId)
  // ... rest of logic
} catch (error) {
  console.error(`❌ Database error checking message ${recordObj.id}:`, error)
  // Fail safe: process the message rather than risk missing it
  // This prevents database issues from blocking all message processing
  console.log(`⚠️ Processing message ${recordObj.id} despite database error`)
  // ... continue with processing
}
```

**Deliverable**: Message processing uses SQLite with proper error handling

### Phase 3: Health Monitoring

**Goal**: Add monitoring capabilities

#### 3.1 Add Health Check Endpoint

Update the health endpoint to include processed message stats:

```typescript
// In packages/server/src/index.ts, update health endpoint:

if (req.url === '/health') {
  const healthStatus = storeManager.getHealthStatus()
  const processingStats = eventProcessor.getProcessingStats()
  const globalResourceStatus = eventProcessor.getGlobalResourceStatus()

  // Add processed message stats
  const processedStats = await eventProcessor.getProcessedMessageStats()

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(
    JSON.stringify({
      // ... existing health data ...
      processedMessages: processedStats,
    })
  )
}
```

Add method to EventProcessor:

```typescript
async getProcessedMessageStats() {
  try {
    const total = await this.processedTracker.getProcessedCount()
    const byStore = new Map<string, number>()

    for (const [storeId] of this.storeStates) {
      const count = await this.processedTracker.getProcessedCount(storeId)
      byStore.set(storeId, count)
    }

    return {
      total,
      byStore: Object.fromEntries(byStore),
      databasePath: this.processedTracker.dbPath,
    }
  } catch (error) {
    return { error: error.message }
  }
}
```

**Deliverable**: Health monitoring working

### Phase 4: Testing & Validation

**Goal**: Verify the solution works correctly under all scenarios

#### 4.1 Integration Tests

**File**: `packages/server/src/services/event-processor-persistence.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventProcessor } from './event-processor.js'
import { ProcessedMessageTracker } from './processed-message-tracker.js'

describe('EventProcessor Persistent Message Tracking', () => {
  let eventProcessor: EventProcessor
  let mockStoreManager: any
  let tracker: ProcessedMessageTracker

  beforeEach(async () => {
    // Setup test environment with real SQLite database
    tracker = new ProcessedMessageTracker('./test-data')
    await tracker.initialize()

    mockStoreManager = {
      updateActivity: vi.fn(),
    }

    eventProcessor = new EventProcessor(mockStoreManager)
  })

  afterEach(async () => {
    await tracker.close()
    eventProcessor.stopAll()
  })

  it('should not reprocess messages after restart', async () => {
    const messageId = 'msg-test-123'
    const storeId = 'store-test'

    // Simulate processing a message
    const claimed1 = await tracker.markProcessed(messageId, storeId)
    expect(claimed1).toBe(true) // First instance claims it

    // Simulate restart - create new tracker (same database)
    const tracker2 = new ProcessedMessageTracker('./test-data')
    await tracker2.initialize()

    // Should remember it was already processed
    const isProcessed = await tracker2.isProcessed(messageId, storeId)
    expect(isProcessed).toBe(true)

    // Attempting to claim again should fail
    const claimed2 = await tracker2.markProcessed(messageId, storeId)
    expect(claimed2).toBe(false) // Already exists

    await tracker2.close()
  })

  it('should handle concurrent processing attempts', async () => {
    const messageId = 'msg-concurrent-123'
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
})
```

#### 4.2 Manual Testing Scenarios

Create test script to validate deployment scenarios:

**File**: `packages/server/scripts/test-persistence.ts`

```typescript
#!/usr/bin/env tsx

import { ProcessedMessageTracker } from '../src/services/processed-message-tracker.js'

async function testPersistence() {
  console.log('🧪 Testing message persistence...')

  const tracker1 = new ProcessedMessageTracker()
  await tracker1.initialize()

  // Simulate processing some messages
  const testMessages = [
    { id: 'msg-1', storeId: 'store-a' },
    { id: 'msg-2', storeId: 'store-a' },
    { id: 'msg-3', storeId: 'store-b' },
  ]

  for (const msg of testMessages) {
    const claimed = await tracker1.markProcessed(msg.id, msg.storeId)
    console.log(`Message ${msg.id}: ${claimed ? 'PROCESSED' : 'SKIPPED'}`)
  }

  await tracker1.close()
  console.log('📝 First instance shut down')

  // Simulate restart
  const tracker2 = new ProcessedMessageTracker()
  await tracker2.initialize()

  console.log('🔄 Second instance started')

  // Check persistence
  for (const msg of testMessages) {
    const isProcessed = await tracker2.isProcessed(msg.id, msg.storeId)
    console.log(`Message ${msg.id}: ${isProcessed ? 'REMEMBERED' : 'FORGOTTEN'} ❌`)
  }

  await tracker2.close()
  console.log('✅ Test complete')
}

testPersistence().catch(console.error)
```

#### 4.3 Performance Testing

Test SQLite performance under load:

```typescript
async function testPerformance() {
  const tracker = new ProcessedMessageTracker()
  await tracker.initialize()

  console.log('⏱️ Performance testing...')
  const start = Date.now()

  // Test 1000 message checks (simulating high load)
  for (let i = 0; i < 1000; i++) {
    await tracker.isProcessed(`msg-${i}`, 'store-test')
    if (i % 100 === 0) {
      await tracker.markProcessed(`msg-${i}`, 'store-test')
    }
  }

  const elapsed = Date.now() - start
  console.log(`✅ 1000 operations completed in ${elapsed}ms (${elapsed / 1000}ms per operation)`)

  await tracker.close()
}
```

**Deliverable**: All tests passing with performance under 5ms per operation

## Deployment Considerations

### Render Configuration

1. **Attached Disk**: Ensure Render service has persistent disk mounted
2. **Environment Variables**:

   ```env
   STORE_DATA_PATH=/opt/render/project/data  # Render's persistent disk path
   ```

3. **Database Location**: SQLite file will be at `/opt/render/project/data/processed-messages.db`

### Migration Strategy

1. **Deploy with dual tracking**: Run both in-memory and SQLite tracking in parallel
2. **Validate consistency**: Log when the two systems disagree
3. **Monitor for issues**: Watch error rates and processing delays
4. **Switch over**: Remove in-memory tracking after stable operation

### Future Enhancements

- **Cleanup mechanism**: Add periodic removal of old processed message records to prevent unbounded database growth
- **Advanced monitoring**: Database size tracking and alerting
- **Backup strategy**: Regular SQLite database backups

This implementation plan provides a robust solution that eliminates duplicate message processing while maintaining operational simplicity appropriate for the current scale of 10s of messages per minute.
