import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Store as LiveStore } from '@livestore/livestore'

const processedCounts = new Map<string, number>()

vi.mock('../../src/services/processed-message-tracker.js', () => {
  class MockProcessedMessageTracker {
    initialize = vi.fn().mockResolvedValue(undefined)
    close = vi.fn().mockResolvedValue(undefined)

    async getProcessedCount(storeId?: string): Promise<number> {
      if (!storeId) {
        let total = 0
        for (const value of processedCounts.values()) {
          total += value
        }
        return total
      }

      return processedCounts.get(storeId) ?? 0
    }

    markProcessed = vi.fn()
    isProcessed = vi.fn()

    get databasePath(): string {
      return 'mock.db'
    }
  }

  return { ProcessedMessageTracker: MockProcessedMessageTracker }
})

import { EventProcessor } from '../../src/services/event-processor.js'
import type { StoreManager } from '../../src/services/store-manager.js'

class MockStore {
  constructor(private readonly tables: Record<string, any[]>) {}

  async query(handler: (db: any) => any) {
    const db = {
      table: (name: string) => ({
        all: () => [...(this.tables[name] ?? [])],
      }),
    }

    return handler(db)
  }
}

class MockStoreManager {
  constructor(private readonly stores: Map<string, LiveStore>) {}

  getAllStores(): Map<string, LiveStore> {
    return this.stores
  }

  getStore(storeId: string): LiveStore | null {
    return this.stores.get(storeId) ?? null
  }

  getAllStoreInfo(): Map<string, unknown> {
    return new Map()
  }

  updateActivity(): void {
    // no-op for tests
  }
}

describe('EventProcessor live store stats', () => {
  beforeEach(() => {
    processedCounts.clear()
  })

  it('captures per-store message counts and totals', async () => {
    const storeId = 'store-1'
    processedCounts.set(storeId, 2)

    const messages = [
      { id: 'm1', role: 'user', createdAt: new Date('2024-01-01T10:00:00Z') },
      { id: 'm2', role: 'assistant', createdAt: new Date('2024-01-01T10:02:00Z') },
      { id: 'm3', role: 'user', createdAt: new Date('2024-01-01T10:05:00Z') },
    ]

    const store = new MockStore({
      chatMessages: messages,
      conversations: [{ id: 'c1', createdAt: new Date('2024-01-01T09:00:00Z') }],
    }) as unknown as LiveStore

    const mockStoreManager = new MockStoreManager(new Map([[storeId, store]])) as unknown as StoreManager
    const eventProcessor = new EventProcessor(mockStoreManager)

    const stats = await eventProcessor.getLiveStoreStats()
    const perStore = stats.perStore.get(storeId)

    expect(perStore).toEqual({
      chatMessages: 3,
      userMessages: 2,
      assistantMessages: 1,
      processedUserMessages: 2,
      pendingUserMessages: 0,
      conversations: 1,
      lastMessageAt: new Date('2024-01-01T10:05:00Z').toISOString(),
      lastUserMessageAt: new Date('2024-01-01T10:05:00Z').toISOString(),
      lastAssistantMessageAt: new Date('2024-01-01T10:02:00Z').toISOString(),
    })

    expect(stats.totals).toEqual({
      chatMessages: 3,
      userMessages: 2,
      assistantMessages: 1,
      processedUserMessages: 2,
      pendingUserMessages: 0,
      conversations: 1,
      lastMessageAt: new Date('2024-01-01T10:05:00Z').toISOString(),
      lastUserMessageAt: new Date('2024-01-01T10:05:00Z').toISOString(),
      lastAssistantMessageAt: new Date('2024-01-01T10:02:00Z').toISOString(),
    })
  })

  it('records errors per store when LiveStore queries fail', async () => {
    const failingStoreId = 'store-error'

    const failingStore = {
      async query() {
        throw new Error('LiveStore unavailable')
      },
    } as unknown as LiveStore

    const mockStoreManager = new MockStoreManager(
      new Map([[failingStoreId, failingStore]])
    ) as unknown as StoreManager

    const eventProcessor = new EventProcessor(mockStoreManager)
    const stats = await eventProcessor.getLiveStoreStats()

    expect(stats.perStore.get(failingStoreId)).toEqual({ error: 'LiveStore unavailable' })
    expect(stats.totals).toEqual({
      chatMessages: 0,
      userMessages: 0,
      assistantMessages: 0,
      processedUserMessages: 0,
      pendingUserMessages: 0,
      conversations: 0,
      lastMessageAt: null,
      lastUserMessageAt: null,
      lastAssistantMessageAt: null,
    })
  })

  it('surfaces LiveStore backlog details in global resource status', () => {
    const mockStoreManager = new MockStoreManager(new Map()) as unknown as StoreManager
    const eventProcessor = new EventProcessor(mockStoreManager)

    const status = eventProcessor.getGlobalResourceStatus({
      pendingUserMessages: 5,
      userMessages: 12,
    })

    expect(status.pendingUserMessages).toBe(5)
    expect(status.userMessages).toBe(12)
    expect(status.notes).toContain('LiveStore backlog: 5 pending user message(s).')
  })
})
