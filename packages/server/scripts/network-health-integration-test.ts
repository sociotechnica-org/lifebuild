import assert from 'assert'
import net from 'net'
import { setTimeout as delay } from 'timers/promises'
import type { StoreInfo } from '../src/services/store-manager.js'

const waitForPort = async (port: number, timeoutMs: number) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(port, '127.0.0.1')
        socket.once('connect', () => {
          socket.end()
          resolve()
        })
        socket.once('error', reject)
      })
      return
    } catch {
      await delay(200)
    }
  }
  throw new Error(`Timed out waiting for port ${port}`)
}

const getAvailablePort = async (): Promise<number> => {
  return await new Promise((resolve, reject) => {
    const server = net.createServer()
    server.once('error', reject)
    server.listen(0, () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close(() => reject(new Error('Failed to resolve free port')))
        return
      }
      const port = address.port
      server.close(() => resolve(port))
    })
  })
}

const fetchJson = async <T>(url: string, timeoutMs = 5_000): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const response = await fetch(url, { signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId)
  })
  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} from ${url}`)
  }
  return (await response.json()) as T
}

const runNetworkHealthTests = async () => {
  console.log('[test] Network health integration test')

  const port = await getAvailablePort()
  const token = 'network-health-test-token'
  process.env.PORT = String(port)
  process.env.NODE_ENV = 'production'
  process.env.SERVER_BYPASS_TOKEN = token
  process.env.STORE_IDS = ''

  const { storeManager } = await import('../src/services/store-manager.js')
  await import('../src/index.js')

  await waitForPort(port, 20_000)

  const now = new Date()
  const connectedAt = new Date(now.getTime() - 60_000)
  const disconnectedAt = new Date(now.getTime() - 10_000)
  const storeId = `network-health-${Math.random().toString(36).slice(2, 8)}`

  const stores = (storeManager as { stores: Map<string, StoreInfo> }).stores
  stores.set(storeId, {
    store: {
      shutdownPromise: async () => undefined,
    } as StoreInfo['store'],
    config: {
      storeId,
    },
    connectedAt,
    lastActivity: now,
    status: 'disconnected',
    lastConnectedAt: connectedAt,
    lastDisconnectedAt: disconnectedAt,
    lastNetworkStatusAt: disconnectedAt,
    statusHistory: [
      { status: 'connected', timestamp: connectedAt },
      { status: 'disconnected', timestamp: disconnectedAt },
    ],
    networkStatusHistory: [
      { isConnected: true, timestampMs: connectedAt.getTime() },
      { isConnected: false, timestampMs: disconnectedAt.getTime() },
    ],
    errorCount: 0,
    reconnectAttempts: 0,
    networkStatus: {
      isConnected: false,
      lastUpdatedAt: disconnectedAt,
      timestampMs: disconnectedAt.getTime(),
      disconnectedSince: disconnectedAt,
    },
    monitoringSessionId: 0,
  })

  const baseUrl = `http://127.0.0.1:${port}`

  const unauthorized = await fetch(`${baseUrl}/debug/network-health`)
  assert.strictEqual(unauthorized.status, 401)

  const networkHealth = await fetchJson<{
    timestamp: string
    stores: Record<
      string,
      {
        status: string
        networkStatus: { isConnected: boolean; timestampMs: number }
        lastNetworkStatusAt: string | null
        lastConnectedAt: string | null
        lastDisconnectedAt: string | null
        history: Array<{ isConnected: boolean; timestampMs: number }>
      }
    >
  }>(`${baseUrl}/debug/network-health?token=${token}`)

  assert.ok(networkHealth.timestamp)
  assert.ok(networkHealth.stores[storeId])
  assert.strictEqual(networkHealth.stores[storeId].status, 'disconnected')
  assert.strictEqual(networkHealth.stores[storeId].networkStatus.isConnected, false)
  assert.strictEqual(typeof networkHealth.stores[storeId].networkStatus.timestampMs, 'number')
  assert.ok(networkHealth.stores[storeId].lastNetworkStatusAt)
  assert.ok(networkHealth.stores[storeId].lastConnectedAt)
  assert.ok(networkHealth.stores[storeId].lastDisconnectedAt)
  assert.ok(networkHealth.stores[storeId].history.length > 0)

  const storesResponse = await fetchJson<{
    stores: Array<{
      id: string
      networkStatus: { isConnected: boolean }
      lastNetworkStatusAt: string | null
      lastConnectedAt: string | null
      lastDisconnectedAt: string | null
      offlineDurationMs: number | null
    }>
  }>(`${baseUrl}/stores`)

  const storeEntry = storesResponse.stores.find(store => store.id === storeId)
  assert.ok(storeEntry)
  assert.ok(storeEntry?.networkStatus)
  assert.ok(storeEntry?.lastNetworkStatusAt)
  assert.ok(storeEntry?.lastConnectedAt)
  assert.ok(storeEntry?.lastDisconnectedAt)
  assert.ok(typeof storeEntry?.offlineDurationMs === 'number')

  console.log('[ok] Network health integration test passed')
  process.kill(process.pid, 'SIGTERM')
}

runNetworkHealthTests().catch(error => {
  console.error(error)
  process.exit(1)
})
