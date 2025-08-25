import type { Store as LiveStore } from '@livestore/livestore'
import type { StoreManager } from './store-manager.js'
import { getAllEvents$ } from '@work-squared/shared/queries'

export class EventProcessor {
  private storeManager: StoreManager
  private subscriptions: Map<string, () => void> = new Map()
  private lastSeenSeqNum: Map<string, number> = new Map()

  constructor(storeManager: StoreManager) {
    this.storeManager = storeManager
  }

  startMonitoring(storeId: string, store: LiveStore): void {
    console.log(`📡 Starting event monitoring for store ${storeId}`)

    // Track the last seen sequence number for this store
    this.lastSeenSeqNum.set(storeId, 0)
    
    const unsubscribe = store.subscribe(getAllEvents$, {
      onUpdate: (events) => {
        // Only log new events since last check
        if (!events || events.length === 0) return
        
        const lastSeenSeq = this.lastSeenSeqNum.get(storeId) || 0
        
        // Filter to only new events
        const newEvents = events.filter(e => e.seqNum > lastSeenSeq)
        
        if (newEvents.length === 0) return
        
        console.log(`\n📨 [${new Date().toISOString()}] Store ${storeId} received ${newEvents.length} new events:`)
        
        for (const event of newEvents) {
          // Log ALL events with details
          console.log(`  📌 ${event.name}`)
          console.log(`     seq: ${event.seqNum}, parent: ${event.parentSeqNum}`)
          if (event.args && Object.keys(event.args).length > 0) {
            const argsStr = JSON.stringify(event.args, null, 2)
            if (argsStr.length > 200) {
              console.log(`     args: ${argsStr.substring(0, 200)}...`)
            } else {
              console.log(`     args:`, argsStr.split('\n').map((line, i) => i === 0 ? line : `          ${line}`).join('\n'))
            }
          }
        }
        
        // Update the last seen sequence number
        const maxSeq = Math.max(...newEvents.map(e => e.seqNum))
        this.lastSeenSeqNum.set(storeId, maxSeq)
        
        // Update activity tracker
        this.storeManager.updateActivity(storeId)

        this.handleEvents(storeId, newEvents)
      }
    })

    this.subscriptions.set(storeId, unsubscribe)
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

  private async processEvent(storeId: string, event: any): Promise<void> {
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