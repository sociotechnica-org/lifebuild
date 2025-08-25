import type { Store as LiveStore } from '@livestore/livestore'
import { queryDb } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { tables } from '@work-squared/shared/schema'

export class EventProcessor {
  private storeManager: StoreManager
  private subscriptions: Map<string, () => void> = new Map()
  private lastSeenCounts: Map<string, Map<string, number>> = new Map()

  constructor(storeManager: StoreManager) {
    this.storeManager = storeManager
  }

  startMonitoring(storeId: string, store: LiveStore): void {
    console.log(`📡 Starting event monitoring for store ${storeId}`)

    // Initialize counters for this store
    this.lastSeenCounts.set(storeId, new Map())

    // Monitor chat messages table to detect activity
    const chatMessagesQuery = queryDb(tables.chatMessages.select(), {
      label: 'monitor-chatMessages',
    })

    const unsubscribe = store.subscribe(chatMessagesQuery as any, {
      onUpdate: (records: any[]) => {
        this.handleTableUpdate(storeId, 'chatMessages', records)
      },
    })

    this.subscriptions.set(storeId, unsubscribe)
  }

  private handleTableUpdate(storeId: string, tableName: string, records: any[]): void {
    const storeCounters = this.lastSeenCounts.get(storeId)!
    const lastCount = storeCounters.get(tableName) || 0
    const currentCount = records.length

    // Only log if we have new records
    if (currentCount > lastCount) {
      const newRecords = records.slice(0, currentCount - lastCount).reverse() // Get newest records first

      for (const record of newRecords) {
        const timestamp = new Date().toISOString()
        const displayText = record.message || record.name || record.title || record.id
        const truncatedText =
          displayText.length > 50 ? `${displayText.slice(0, 50)}...` : displayText

        console.log(`📨 [${timestamp}] ${storeId}/${tableName}: ${truncatedText}`)
      }

      storeCounters.set(tableName, currentCount)

      // Update activity tracker
      this.storeManager.updateActivity(storeId)

      this.handleEvents(
        storeId,
        newRecords.map(r => ({ type: tableName, data: r }))
      )
    }
  }

  stopMonitoring(storeId: string): void {
    const unsubscribe = this.subscriptions.get(storeId)
    if (unsubscribe) {
      unsubscribe()
      this.subscriptions.delete(storeId)
      console.log(`🛑 Stopped event monitoring for store ${storeId}`)
    }
  }

  private async handleEvents(storeId: string, events: any[]): Promise<void> {
    // Process events here
    // For now, just log them
    for (const event of events) {
      try {
        await this.processEvent(storeId, event)
      } catch (error) {
        console.error(`❌ Error processing event in store ${storeId}:`, error)
      }
    }
  }

  private async processEvent(_storeId: string, _event: any): Promise<void> {
    // Future: Implement specific event processing logic here
    // For now, all events are logged in startMonitoring
  }

  stopAll(): void {
    for (const [storeId, unsubscribe] of this.subscriptions) {
      unsubscribe()
      console.log(`🛑 Stopped monitoring store ${storeId}`)
    }
    this.subscriptions.clear()
  }
}
