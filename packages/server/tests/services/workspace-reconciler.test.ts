import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkspaceReconciler } from '../../src/services/workspace-reconciler.js'
import type {
  WorkspaceDirectory,
  WorkspaceDirectoryEntry,
} from '../../src/services/workspace-directory.js'
import type { WorkspaceOrchestratorSummary } from '../../src/services/workspace-orchestrator.js'

class FakeWorkspaceDirectory implements WorkspaceDirectory {
  private workspaces: WorkspaceDirectoryEntry[] = []

  setWorkspaces(entries: WorkspaceDirectoryEntry[]) {
    this.workspaces = entries
  }

  async listWorkspaces(): Promise<WorkspaceDirectoryEntry[]> {
    return this.workspaces
  }
}

class FakeWorkspaceOrchestrator {
  private monitored = new Set<string>()
  ensureMonitored = vi.fn(async (storeId: string) => {
    this.addMonitored(storeId)
  })
  stopMonitoring = vi.fn(async (storeId: string) => {
    this.monitored.delete(storeId)
  })

  constructor(initialIds: string[] = []) {
    initialIds.forEach(id => this.monitored.add(id))
  }

  listMonitored(): string[] {
    return Array.from(this.monitored).sort()
  }

  getSummary(): WorkspaceOrchestratorSummary {
    return {
      monitoredStoreIds: this.listMonitored(),
      lastProvisionedAt: null,
      lastDeprovisionedAt: null,
      totalProvisioned: 0,
      totalDeprovisioned: 0,
      stores: Array.from(this.monitored).map(storeId => ({
        storeId,
        status: 'monitoring' as const,
        firstMonitoredAt: new Date().toISOString(),
        lastEnsuredAt: new Date().toISOString(),
        lastStoppedAt: null,
      })),
    }
  }

  addMonitored(storeId: string) {
    this.monitored.add(storeId)
  }
}

describe('WorkspaceReconciler', () => {
  let directory: FakeWorkspaceDirectory
  let orchestrator: FakeWorkspaceOrchestrator

  beforeEach(() => {
    vi.useRealTimers()
    directory = new FakeWorkspaceDirectory()
    orchestrator = new FakeWorkspaceOrchestrator(['workspace-a'])
  })

  it('adds missing workspaces to orchestrator', async () => {
    directory.setWorkspaces([
      { instanceId: 'workspace-a' },
      { instanceId: 'workspace-b' },
    ])

    const reconciler = new WorkspaceReconciler({
      orchestrator: orchestrator as unknown as any,
      directory,
      intervalMs: 60000,
    })

    const result = await reconciler.reconcile()
    expect(result?.added).toEqual(['workspace-b'])
    expect(orchestrator.ensureMonitored).toHaveBeenCalledWith('workspace-b')
    expect(orchestrator.listMonitored()).toContain('workspace-b')

    const status = reconciler.getStatus()
    expect(status.enabled).toBe(true)
    if (status.enabled) {
      expect(status.totals.runs).toBe(1)
      expect(status.lastResult?.added).toEqual(['workspace-b'])
    }
  })

  it('removes orphaned workspaces from orchestrator', async () => {
    orchestrator = new FakeWorkspaceOrchestrator(['workspace-a', 'workspace-z'])
    directory.setWorkspaces([{ instanceId: 'workspace-a' }])

    const reconciler = new WorkspaceReconciler({
      orchestrator: orchestrator as unknown as any,
      directory,
      intervalMs: 60000,
    })

    const result = await reconciler.reconcile()
    expect(result?.removed).toEqual(['workspace-z'])
    expect(orchestrator.stopMonitoring).toHaveBeenCalledWith('workspace-z')
    expect(orchestrator.listMonitored()).not.toContain('workspace-z')
  })

  it('records failures when orchestrator actions throw', async () => {
    orchestrator = new FakeWorkspaceOrchestrator(['workspace-a'])
    ;(orchestrator.ensureMonitored as any).mockImplementation(async (storeId: string) => {
      if (storeId === 'workspace-b') {
        throw new Error('provision failed')
      }
      orchestrator.addMonitored(storeId)
    })

    directory.setWorkspaces([
      { instanceId: 'workspace-a' },
      { instanceId: 'workspace-b' },
    ])

    const reconciler = new WorkspaceReconciler({
      orchestrator: orchestrator as unknown as any,
      directory,
      intervalMs: 60000,
    })

    const result = await reconciler.reconcile()
    expect(result?.failedAdds).toHaveLength(1)
    expect(result?.failedAdds?.[0]).toMatchObject({
      storeId: 'workspace-b',
      error: 'provision failed',
    })

    const status = reconciler.getStatus()
    if (status.enabled) {
      expect(status.totals.failures).toBe(1)
      expect(status.lastError?.message).toContain('failure')
    }
  })

  it('skips concurrent runs', async () => {
    directory.listWorkspaces = vi.fn(
      async () =>
        await new Promise<WorkspaceDirectoryEntry[]>(resolve =>
          setTimeout(() => resolve([{ instanceId: 'workspace-a' }]), 20)
        )
    )

    const reconciler = new WorkspaceReconciler({
      orchestrator: orchestrator as unknown as any,
      directory,
      intervalMs: 60000,
    })

    const firstRunPromise = reconciler.reconcile()
    const secondRunPromise = reconciler.reconcile()

    const [firstResult, secondResult] = await Promise.all([firstRunPromise, secondRunPromise])
    expect(firstResult).not.toBeNull()
    expect(secondResult).toBeNull()
  })
})
