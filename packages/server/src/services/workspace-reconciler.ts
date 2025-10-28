import { operationLogger } from '../utils/logger.js'
import type { WorkspaceOrchestrator } from './workspace-orchestrator.js'
import type { WorkspaceDirectory } from './workspace-directory.js'

const logger = operationLogger('workspace_reconciler')

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000
const MIN_INTERVAL_MS = 30 * 1000

export interface WorkspaceReconcilerOptions {
  orchestrator: WorkspaceOrchestrator
  directory: WorkspaceDirectory
  intervalMs?: number
}

export interface ReconciliationFailure {
  storeId: string
  error: string
}

export interface ReconciliationResult {
  added: string[]
  removed: string[]
  failedAdds: ReconciliationFailure[]
  failedRemovals: ReconciliationFailure[]
  authoritativeCount: number
  monitoredCount: number
}

export type WorkspaceReconcilerStatus =
  | {
      enabled: true
      intervalMs: number
      isRunning: boolean
      lastRunStartedAt?: string
      lastRunCompletedAt?: string
      lastSuccessAt?: string
      lastDurationMs?: number
      totals: {
        runs: number
        successes: number
        failures: number
      }
      lastResult?: ReconciliationResult & { driftCount: number }
      lastError?: {
        timestamp: string
        message: string
      }
    }
  | {
      enabled: false
      reason: string
    }

export class WorkspaceReconciler {
  private readonly orchestrator: WorkspaceOrchestrator
  private readonly directory: WorkspaceDirectory
  private readonly intervalMs: number
  private timer: NodeJS.Timeout | null = null
  private running = false

  private lastRunStartedAt?: Date
  private lastRunCompletedAt?: Date
  private lastSuccessAt?: Date
  private lastDurationMs?: number
  private lastError?: { timestamp: Date; message: string }
  private lastResult?: ReconciliationResult & { driftCount: number }
  private totalRuns = 0
  private totalSuccesses = 0
  private totalFailures = 0

  constructor(options: WorkspaceReconcilerOptions) {
    this.orchestrator = options.orchestrator
    this.directory = options.directory

    const configuredInterval = options.intervalMs ?? DEFAULT_INTERVAL_MS
    this.intervalMs = Math.max(MIN_INTERVAL_MS, configuredInterval)
  }

  start(): void {
    if (this.timer) {
      logger.warn('Workspace reconciler already started')
      return
    }

    logger.info({ intervalMs: this.intervalMs }, 'Starting workspace reconciler')
    // Kick off an immediate reconcile without awaiting it so startup can continue
    void this.reconcile()
    this.timer = setInterval(() => {
      void this.reconcile()
    }, this.intervalMs)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
      logger.info('Workspace reconciler stopped')
    }
  }

  async reconcile(): Promise<ReconciliationResult | null> {
    if (this.running) {
      logger.warn('Skipping reconcile run because a previous execution is still in progress')
      return null
    }

    this.running = true
    this.totalRuns += 1
    const startedAt = new Date()
    this.lastRunStartedAt = startedAt
    logger.info({ startedAt: startedAt.toISOString() }, 'Workspace reconciliation started')

    const startTime = Date.now()

    try {
      const authoritative = await this.directory.listWorkspaces()
      const authoritativeIds = new Set<string>()
      for (const record of authoritative) {
        if (!record.instanceId) {
          continue
        }
        authoritativeIds.add(record.instanceId)
      }

      const monitored = new Set(this.orchestrator.listMonitored())

      const toAdd = difference(authoritativeIds, monitored)
      const toRemove = difference(monitored, authoritativeIds)

      const failedAdds: ReconciliationFailure[] = []
      const added: string[] = []
      for (const storeId of toAdd) {
        try {
          await this.orchestrator.ensureMonitored(storeId)
          added.push(storeId)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error({ storeId, error: message }, 'Failed to provision store during reconcile')
          failedAdds.push({ storeId, error: message })
        }
      }

      const failedRemovals: ReconciliationFailure[] = []
      const removed: string[] = []
      for (const storeId of toRemove) {
        try {
          await this.orchestrator.stopMonitoring(storeId)
          removed.push(storeId)
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          logger.error({ storeId, error: message }, 'Failed to deprovision store during reconcile')
          failedRemovals.push({ storeId, error: message })
        }
      }

      const completedAt = new Date()
      const durationMs = Date.now() - startTime

      this.lastRunCompletedAt = completedAt
      this.lastDurationMs = durationMs

      const result: ReconciliationResult & { driftCount: number } = {
        added,
        removed,
        failedAdds,
        failedRemovals,
        authoritativeCount: authoritativeIds.size,
        monitoredCount: monitored.size,
        driftCount: added.length + removed.length + failedAdds.length + failedRemovals.length,
      }

      this.lastResult = result

      if (failedAdds.length === 0 && failedRemovals.length === 0) {
        this.totalSuccesses += 1
        this.lastSuccessAt = completedAt
        logger.info(
          {
            added: added.length,
            removed: removed.length,
            durationMs,
          },
          'Workspace reconciliation completed successfully'
        )
      } else {
        this.totalFailures += 1
        this.lastError = {
          timestamp: completedAt,
          message: `Reconciliation completed with ${failedAdds.length + failedRemovals.length} failure(s)`,
        }
        logger.warn(
          {
            added: added.length,
            removed: removed.length,
            failedAdds: failedAdds.length,
            failedRemovals: failedRemovals.length,
            durationMs,
          },
          'Workspace reconciliation completed with partial failures'
        )
      }

      return result
    } catch (error) {
      this.totalFailures += 1
      const completedAt = new Date()
      const durationMs = Date.now() - startTime
      this.lastRunCompletedAt = completedAt
      this.lastDurationMs = durationMs
      this.lastError = {
        timestamp: completedAt,
        message: error instanceof Error ? error.message : String(error),
      }
      logger.error({ error }, 'Workspace reconciliation failed')
      return null
    } finally {
      this.running = false
    }
  }

  getStatus(): WorkspaceReconcilerStatus {
    return {
      enabled: true,
      intervalMs: this.intervalMs,
      isRunning: this.running,
      lastRunStartedAt: this.lastRunStartedAt?.toISOString(),
      lastRunCompletedAt: this.lastRunCompletedAt?.toISOString(),
      lastSuccessAt: this.lastSuccessAt?.toISOString(),
      lastDurationMs: this.lastDurationMs,
      totals: {
        runs: this.totalRuns,
        successes: this.totalSuccesses,
        failures: this.totalFailures,
      },
      lastResult: this.lastResult,
      lastError: this.lastError
        ? {
            timestamp: this.lastError.timestamp.toISOString(),
            message: this.lastError.message,
          }
        : undefined,
    }
  }
}

export function getDisabledReconcilerStatus(reason: string): WorkspaceReconcilerStatus {
  logger.warn({ reason }, 'Workspace reconciler is disabled')
  return {
    enabled: false,
    reason,
  }
}

function difference(primary: Set<string>, secondary: Set<string>): string[] {
  const result: string[] = []
  for (const value of primary) {
    if (!secondary.has(value)) {
      result.push(value)
    }
  }
  result.sort()
  return result
}
