import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Store as LiveStore } from '@livestore/livestore'
import { WorkspaceOrchestrator } from '../../src/services/workspace-orchestrator.js'
import type { StoreManager } from '../../src/services/store-manager.js'
import type { EventProcessor } from '../../src/services/event-processor.js'

const createLiveStore = (): LiveStore =>
  ({
    shutdownPromise: vi.fn().mockResolvedValue(undefined),
  }) as unknown as LiveStore

describe('WorkspaceOrchestrator', () => {
  let mockStoreManager: StoreManager
  let mockEventProcessor: EventProcessor
  let orchestrator: WorkspaceOrchestrator
  let liveStore: LiveStore
  let getStoreMock: ReturnType<typeof vi.fn>
  let addStoreMock: ReturnType<typeof vi.fn>
  let removeStoreMock: ReturnType<typeof vi.fn>
  let shutdownMock: ReturnType<typeof vi.fn>
  let startMonitoringMock: ReturnType<typeof vi.fn>
  let stopMonitoringMock: ReturnType<typeof vi.fn>
  let stopAllMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    liveStore = createLiveStore()

    getStoreMock = vi.fn().mockReturnValue(liveStore)
    addStoreMock = vi.fn().mockResolvedValue(liveStore)
    removeStoreMock = vi.fn().mockResolvedValue(undefined)
    shutdownMock = vi.fn().mockResolvedValue(undefined)

    mockStoreManager = {
      getStore: getStoreMock,
      addStore: addStoreMock,
      removeStore: removeStoreMock,
      shutdown: shutdownMock,
    } as unknown as StoreManager

    startMonitoringMock = vi.fn().mockResolvedValue(undefined)
    stopMonitoringMock = vi.fn()
    stopAllMock = vi.fn()

    mockEventProcessor = {
      startMonitoring: startMonitoringMock,
      stopMonitoring: stopMonitoringMock,
      stopAll: stopAllMock,
    } as unknown as EventProcessor

    orchestrator = new WorkspaceOrchestrator(mockStoreManager, mockEventProcessor)
  })

  it('ensures monitoring for existing stores idempotently', async () => {
    const storeId = 'store-123'

    await orchestrator.ensureMonitored(storeId)
    await orchestrator.ensureMonitored(storeId)

    expect(getStoreMock).toHaveBeenCalledWith(storeId)
    expect(addStoreMock).not.toHaveBeenCalled()
    expect(startMonitoringMock).toHaveBeenCalledTimes(2)

    const summary = orchestrator.getSummary()
    expect(summary.monitoredStoreIds).toEqual([storeId])
    expect(summary.totalProvisioned).toBe(1)
  })

  it('adds stores that are not already managed before monitoring', async () => {
    const storeId = 'store-new'
    getStoreMock.mockReturnValueOnce(null)

    await orchestrator.ensureMonitored(storeId)

    expect(addStoreMock).toHaveBeenCalledWith(storeId)
    expect(startMonitoringMock).toHaveBeenCalledWith(storeId, liveStore)
  })

  it('stops monitoring and updates summary metadata', async () => {
    const storeId = 'store-stop'

    await orchestrator.ensureMonitored(storeId)
    await orchestrator.stopMonitoring(storeId)

    expect(stopMonitoringMock).toHaveBeenCalledWith(storeId)
    expect(removeStoreMock).toHaveBeenCalledWith(storeId)

    const summary = orchestrator.getSummary()
    expect(summary.monitoredStoreIds).toEqual([])
    expect(summary.totalDeprovisioned).toBe(1)
    const storeEntry = summary.stores.find(entry => entry.storeId === storeId)
    expect(storeEntry?.status).toBe('stopped')
    expect(storeEntry?.lastStoppedAt).not.toBeNull()
  })

  it('shutdown stops monitored stores and delegates to dependencies', async () => {
    const firstStore = 'store-a'
    const secondStore = 'store-b'

    await orchestrator.ensureMonitored(firstStore)
    await orchestrator.ensureMonitored(secondStore)

    await orchestrator.shutdown()

    expect(stopMonitoringMock).toHaveBeenCalledWith(firstStore)
    expect(stopMonitoringMock).toHaveBeenCalledWith(secondStore)
    expect(stopAllMock).toHaveBeenCalledTimes(1)
    expect(shutdownMock).toHaveBeenCalledTimes(1)
  })
})
