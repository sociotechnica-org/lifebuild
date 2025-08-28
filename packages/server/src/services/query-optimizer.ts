import type { Store } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'

interface QueryBatch<T = any> {
  key: string
  query: any
  resolver: (result: T[]) => void
  rejecter: (error: Error) => void
}

interface CacheEntry<T = any> {
  data: T[]
  timestamp: number
  ttl: number
}

export class QueryOptimizer {
  private queryBatches: Map<string, QueryBatch[]> = new Map()
  private queryCache: Map<string, CacheEntry> = new Map()
  private batchTimeout = 10 // 10ms batching window
  private defaultCacheTTL = 30000 // 30 seconds cache
  private maxCacheSize = 1000
  private batchTimers: Map<string, NodeJS.Timeout> = new Map()
  private cacheCleanupInterval: NodeJS.Timeout | undefined

  constructor(
    private store: Store,
    options?: {
      batchTimeout?: number
      defaultCacheTTL?: number
      maxCacheSize?: number
    }
  ) {
    if (options?.batchTimeout) this.batchTimeout = options.batchTimeout
    if (options?.defaultCacheTTL) this.defaultCacheTTL = options.defaultCacheTTL
    if (options?.maxCacheSize) this.maxCacheSize = options.maxCacheSize

    // Periodic cache cleanup
    this.cacheCleanupInterval = setInterval(() => this.cleanupCache(), 60000) // Every minute
  }

  /**
   * Execute a query with automatic batching and caching
   */
  async query<T = any>(
    query: any,
    options?: {
      cacheKey?: string
      cacheTTL?: number
      skipCache?: boolean
      priority?: 'high' | 'normal' | 'low'
    }
  ): Promise<T[]> {
    const cacheKey = options?.cacheKey || this.generateCacheKey(query)

    // Check cache first (unless skipped)
    if (!options?.skipCache) {
      const cached = this.getFromCache<T>(cacheKey)
      if (cached) {
        return cached
      }
    }

    // For high priority queries, execute immediately
    if (options?.priority === 'high') {
      const result = this.store.query(query) as T[]
      this.setCache(cacheKey, result, options?.cacheTTL)
      return result
    }

    // Batch the query for optimization
    return this.batchQuery<T>(query, cacheKey, options?.cacheTTL)
  }

  /**
   * Execute multiple queries concurrently with automatic optimization
   */
  async queryAll<T = any>(
    queries: Array<{
      query: any
      cacheKey?: string
      cacheTTL?: number
      skipCache?: boolean
    }>
  ): Promise<T[][]> {
    const promises = queries.map(({ query, cacheKey, cacheTTL, skipCache }) =>
      this.query<T>(query, { cacheKey, cacheTTL, skipCache })
    )

    return Promise.all(promises)
  }

  /**
   * Execute queries with different priorities
   */
  async queryWithPriority<T = any>(
    queries: Array<{
      query: any
      priority: 'high' | 'normal' | 'low'
      cacheKey?: string
      cacheTTL?: number
    }>
  ): Promise<T[][]> {
    // Separate by priority
    const highPriority = queries.filter(q => q.priority === 'high')
    const normalPriority = queries.filter(q => q.priority === 'normal')
    const lowPriority = queries.filter(q => q.priority === 'low')

    const results: T[][] = []

    // Execute high priority immediately
    for (const { query, cacheKey, cacheTTL } of highPriority) {
      results.push(await this.query<T>(query, { cacheKey, cacheTTL, priority: 'high' }))
    }

    // Batch normal and low priority
    const normalResults = await this.queryAll<T>(normalPriority)
    const lowResults = await this.queryAll<T>(lowPriority)

    results.push(...normalResults, ...lowResults)
    return results
  }

  /**
   * Batch similar queries together
   */
  private async batchQuery<T>(query: any, cacheKey: string, cacheTTL?: number): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const batchKey = this.generateBatchKey(query)

      // Add to batch
      const batch: QueryBatch<T> = {
        key: cacheKey,
        query,
        resolver: resolve,
        rejecter: reject,
      }

      if (!this.queryBatches.has(batchKey)) {
        this.queryBatches.set(batchKey, [])
      }
      this.queryBatches.get(batchKey)!.push(batch)

      // Set up batch execution timer if not already set
      if (!this.batchTimers.has(batchKey)) {
        const timer = setTimeout(() => {
          this.executeBatch(batchKey, cacheTTL)
        }, this.batchTimeout)

        this.batchTimers.set(batchKey, timer)
      }
    })
  }

  /**
   * Execute a batch of queries
   */
  private async executeBatch(batchKey: string, cacheTTL?: number): Promise<void> {
    const batches = this.queryBatches.get(batchKey)
    if (!batches || batches.length === 0) return

    // Clear batch and timer
    this.queryBatches.delete(batchKey)
    const timer = this.batchTimers.get(batchKey)
    if (timer) {
      clearTimeout(timer)
      this.batchTimers.delete(batchKey)
    }

    try {
      // Execute all queries in the batch
      const results = await Promise.allSettled(
        batches.map(batch => {
          try {
            return this.store.query(batch.query)
          } catch (error) {
            throw error
          }
        })
      )

      // Process results and resolve/reject promises
      results.forEach((result, index) => {
        const batch = batches[index]

        if (result.status === 'fulfilled') {
          const data = result.value as any[]

          // Cache the result
          this.setCache(batch.key, data, cacheTTL)

          // Resolve the promise
          batch.resolver(data)
        } else {
          // Reject the promise
          batch.rejecter(result.reason)
        }
      })
    } catch (error) {
      // If batch execution fails, reject all promises
      batches.forEach(batch => {
        batch.rejecter(error as Error)
      })
    }
  }

  /**
   * Generate cache key from query
   */
  private generateCacheKey(query: any): string {
    // Simple serialization - could be improved for complex queries
    try {
      return `query:${JSON.stringify(query)}`
    } catch {
      return `query:${query.toString()}`
    }
  }

  /**
   * Generate batch key for similar queries
   */
  private generateBatchKey(query: any): string {
    // Group by table/operation type for batching
    try {
      const serialized = JSON.stringify(query)
      // Extract table name or operation type
      const tableMatch = serialized.match(/"table":\s*"([^"]+)"/)
      const operationMatch = serialized.match(/"operation":\s*"([^"]+)"/)

      return `batch:${tableMatch?.[1] || 'unknown'}:${operationMatch?.[1] || 'select'}`
    } catch {
      return 'batch:unknown'
    }
  }

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T[] | null {
    const entry = this.queryCache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.queryCache.delete(key)
      return null
    }

    return entry.data as T[]
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T[], ttl?: number): void {
    // Enforce cache size limit
    if (this.queryCache.size >= this.maxCacheSize) {
      this.evictOldestCacheEntry()
    }

    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL,
    })
  }

  /**
   * Evict oldest cache entry
   */
  private evictOldestCacheEntry(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.queryCache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.queryCache.delete(oldestKey)
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, entry] of this.queryCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.queryCache.delete(key))

    if (toDelete.length > 0) {
      console.log(`🧹 Cleaned up ${toDelete.length} expired query cache entries`)
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.queryCache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    maxSize: number
    hitRate?: number
    entries: Array<{ key: string; age: number; ttl: number }>
  } {
    const now = Date.now()
    const entries = Array.from(this.queryCache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      ttl: entry.ttl,
    }))

    return {
      size: this.queryCache.size,
      maxSize: this.maxCacheSize,
      entries,
    }
  }

  /**
   * Optimize frequently accessed queries
   */
  optimizeHotQueries(): void {
    // Could implement query frequency tracking and pre-warming
    console.log('🚀 Query optimization: Hot query analysis not yet implemented')
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear cache cleanup interval
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval)
      this.cacheCleanupInterval = undefined
    }

    // Clear all batch timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer)
    }
    this.batchTimers.clear()

    // Clear batches
    this.queryBatches.clear()

    // Clear cache
    this.clearCache()
  }
}

/**
 * Utility functions for common query patterns
 */
export class QueryPatterns {
  constructor(private optimizer: QueryOptimizer) {}

  /**
   * Get conversation with related data (worker, history) in one optimized call
   */
  async getConversationWithContext(
    conversationId: string,
    tables: any
  ): Promise<{
    conversation?: any
    worker?: any
    chatHistory: any[]
  }> {
    const [conversationResult, chatHistoryResult] = await this.optimizer.queryAll([
      {
        query: queryDb(tables.conversations.select().where('id', '=', conversationId)),
        cacheKey: `conversation:${conversationId}`,
        cacheTTL: 10000, // 10 seconds for conversation data
      },
      {
        query: queryDb(
          tables.chatMessages
            .select()
            .where('conversationId', '=', conversationId)
            .orderBy('createdAt', 'asc')
        ),
        cacheKey: `chat-history:${conversationId}`,
        cacheTTL: 5000, // 5 seconds for chat history
      },
    ])

    const conversation = conversationResult[0]
    const chatHistory = chatHistoryResult

    // Get worker data if conversation has workerId
    let worker
    if (conversation?.workerId) {
      const workerResult = await this.optimizer.query(
        queryDb(tables.workers.select().where('id', '=', conversation.workerId)),
        {
          cacheKey: `worker:${conversation.workerId}`,
          cacheTTL: 60000, // 1 minute for worker data
        }
      )
      worker = workerResult[0]
    }

    return {
      conversation,
      worker,
      chatHistory,
    }
  }

  /**
   * Get multiple conversations with their contexts efficiently
   */
  async getMultipleConversationsWithContext(
    conversationIds: string[],
    tables: any
  ): Promise<Array<{ conversation?: any; worker?: any; chatHistory: any[] }>> {
    const results = await Promise.all(
      conversationIds.map(id => this.getConversationWithContext(id, tables))
    )

    return results
  }

  /**
   * Preload commonly accessed data
   */
  async preloadCommonData(tables: any): Promise<void> {
    // Preload active conversations
    await this.optimizer.query(
      queryDb(
        tables.conversations
          .select()
          .where('updatedAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      ),
      {
        cacheKey: 'active-conversations',
        cacheTTL: 30000,
      }
    )

    // Preload all workers
    await this.optimizer.query(queryDb(tables.workers.select()), {
      cacheKey: 'all-workers',
      cacheTTL: 300000, // 5 minutes
    })
  }
}
