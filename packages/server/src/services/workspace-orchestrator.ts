import { operationLogger, storeLogger } from '../utils/logger.js'
import type { StoreManager } from './store-manager.js'
import type { EventProcessor } from './event-processor.js'
import type { Store as LiveStore } from '@livestore/livestore'

interface MonitoredStoreMetadata {
  storeId: string
  firstMonitoredAt: Date
  lastEnsuredAt: Date
  lastStoppedAt?: Date
  status: 'monitoring' | 'stopped'
}

export interface WorkspaceOrchestratorSummary {
  monitoredStoreIds: string[]
  lastProvisionedAt: string | null
  lastDeprovisionedAt: string | null
  totalProvisioned: number
  totalDeprovisioned: number
  stores: Array<{
    storeId: string
    status: 'monitoring' | 'stopped'
    firstMonitoredAt: string
    lastEnsuredAt: string
    lastStoppedAt: string | null
  }>
}

export class WorkspaceOrchestrator {
  private readonly storeManager: StoreManager
  private readonly eventProcessor: EventProcessor
  private readonly storeMetadata = new Map<string, MonitoredStoreMetadata>()
  private lastProvisionedAt: Date | null = null
  private lastDeprovisionedAt: Date | null = null
  private totalProvisioned = 0
  private totalDeprovisioned = 0

  constructor(storeManager: StoreManager, eventProcessor: EventProcessor) {
    this.storeManager = storeManager
    this.eventProcessor = eventProcessor
  }

  async ensureMonitored(storeId: string): Promise<void> {
    const log = operationLogger('workspace_orchestrator.ensure_monitored', { storeId })

    const existingMetadata = this.storeMetadata.get(storeId)
    const alreadyMonitoring = existingMetadata?.status === 'monitoring'

    try {
      const store = await this.resolveStore(storeId)

      await this.eventProcessor.startMonitoring(storeId, store)

      const now = new Date()
      if (!alreadyMonitoring) {
        this.totalProvisioned += 1
        this.lastProvisionedAt = now
      }

      const metadata: MonitoredStoreMetadata = existingMetadata
        ? {
            ...existingMetadata,
            lastEnsuredAt: now,
            status: 'monitoring',
          }
        : {
            storeId,
            firstMonitoredAt: now,
            lastEnsuredAt: now,
            status: 'monitoring',
          }

      metadata.lastStoppedAt = existingMetadata?.lastStoppedAt
      this.storeMetadata.set(storeId, metadata)

      log.info({ status: alreadyMonitoring ? 'already_monitoring' : 'monitoring_started' })
    } catch (error) {
      log.error({ error }, 'Failed to ensure store is monitored')
      throw error
    }
  }

  async stopMonitoring(storeId: string): Promise<void> {
    const log = operationLogger('workspace_orchestrator.stop_monitoring', { storeId })

    const metadata = this.storeMetadata.get(storeId)
    const wasMonitoring = metadata?.status === 'monitoring'

    try {
      this.eventProcessor.stopMonitoring(storeId)
      await this.storeManager.removeStore(storeId)

      const now = new Date()

      if (wasMonitoring) {
        this.totalDeprovisioned += 1
        this.lastDeprovisionedAt = now
      }

      this.storeMetadata.set(storeId, {
        storeId,
        firstMonitoredAt: metadata?.firstMonitoredAt ?? now,
        lastEnsuredAt: metadata?.lastEnsuredAt ?? now,
        lastStoppedAt: now,
        status: 'stopped',
      })

      log.info({ status: wasMonitoring ? 'monitoring_stopped' : 'already_stopped' })
    } catch (error) {
      log.error({ error }, 'Failed to stop monitoring store')
      throw error
    }
  }

  listMonitored(): string[] {
    return Array.from(this.storeMetadata.values())
      .filter(metadata => metadata.status === 'monitoring')
      .map(metadata => metadata.storeId)
      .sort()
  }

  getSummary(): WorkspaceOrchestratorSummary {
    return {
      monitoredStoreIds: this.listMonitored(),
      lastProvisionedAt: this.lastProvisionedAt?.toISOString() ?? null,
      lastDeprovisionedAt: this.lastDeprovisionedAt?.toISOString() ?? null,
      totalProvisioned: this.totalProvisioned,
      totalDeprovisioned: this.totalDeprovisioned,
      stores: Array.from(this.storeMetadata.values()).map(metadata => ({
        storeId: metadata.storeId,
        status: metadata.status,
        firstMonitoredAt: metadata.firstMonitoredAt.toISOString(),
        lastEnsuredAt: metadata.lastEnsuredAt.toISOString(),
        lastStoppedAt: metadata.lastStoppedAt?.toISOString() ?? null,
      })),
    }
  }

  async shutdown(): Promise<void> {
    const log = operationLogger('workspace_orchestrator.shutdown')
    log.info('Shutting down workspace orchestrator')

    const monitoredStores = this.listMonitored()
    for (const storeId of monitoredStores) {
      try {
        await this.stopMonitoring(storeId)
      } catch (error) {
        storeLogger(storeId).error({ error }, 'Failed to stop monitoring during shutdown')
      }
    }

    this.eventProcessor.stopAll()
    await this.storeManager.shutdown()
    log.info('Workspace orchestrator shutdown complete')
  }

  private async resolveStore(storeId: string): Promise<LiveStore> {
    const existing = this.storeManager.getStore(storeId)
    if (existing) {
      storeLogger(storeId).debug('Store already exists, reusing instance')
      return existing
    }

    return await this.storeManager.addStore(storeId)
  }
}
