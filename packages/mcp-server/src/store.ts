import { createStorePromise, type Store as LiveStore } from '@livestore/livestore'
import { makeAdapter } from '@livestore/adapter-node'
import { makeWsSync } from '@livestore/sync-cf/client'
import { schema } from '@lifebuild/shared/schema'
import path from 'path'

export interface StoreConfig {
  storeId: string
  syncUrl?: string
  dataPath: string
  connectionTimeoutMs: number
}

const DEFAULT_SYNC_URL = 'ws://localhost:8787'
const DEFAULT_DATA_PATH = './data'
const DEFAULT_CONNECTION_TIMEOUT_MS = 30000

function normalizeSyncUrl(raw: string | undefined): string | undefined {
  if (!raw) {
    return undefined
  }
  const trimmed = raw.trim()
  if (!trimmed || trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'disabled') {
    return undefined
  }
  return trimmed
}

function getSyncPayload(config: StoreConfig): Record<string, string> | undefined {
  const serverBypassToken = process.env.SERVER_BYPASS_TOKEN
  if (process.env.NODE_ENV === 'production' && !serverBypassToken) {
    throw new Error('SERVER_BYPASS_TOKEN is required for production MCP usage.')
  }

  if (!serverBypassToken) {
    return undefined
  }

  return {
    serverBypass: serverBypassToken,
    instanceId: config.storeId,
  }
}

function normalizePingMs(rawEnv: string | undefined, fallback: number, min: number, max: number) {
  if (rawEnv === undefined) return fallback
  const value = Number(rawEnv)
  if (!Number.isFinite(value) || value < min || value > max) {
    return fallback
  }
  return value
}

export function getStoreConfigFromEnv(): StoreConfig {
  const storeId =
    process.env.LIFEBUILD_STORE_ID || process.env.STORE_ID || process.env.LIVESTORE_STORE_ID
  if (!storeId) {
    throw new Error('LIFEBUILD_STORE_ID must be set to target a Lifebuild workspace store.')
  }

  const syncUrl = normalizeSyncUrl(
    process.env.LIFEBUILD_SYNC_URL ?? process.env.LIVESTORE_SYNC_URL ?? DEFAULT_SYNC_URL
  )

  const dataPath =
    process.env.LIFEBUILD_STORE_DATA_PATH || process.env.STORE_DATA_PATH || DEFAULT_DATA_PATH
  const connectionTimeoutMs = Number(
    process.env.LIFEBUILD_STORE_CONNECTION_TIMEOUT_MS ||
      process.env.STORE_CONNECTION_TIMEOUT ||
      DEFAULT_CONNECTION_TIMEOUT_MS
  )

  return {
    storeId,
    syncUrl,
    dataPath,
    connectionTimeoutMs,
  }
}

export async function createStore(configOverrides?: Partial<StoreConfig>): Promise<{
  store: LiveStore
  config: StoreConfig
}> {
  const baseConfig = getStoreConfigFromEnv()
  const config = {
    ...baseConfig,
    ...configOverrides,
  }

  const pingIntervalMs = normalizePingMs(process.env.LIVESTORE_PING_INTERVAL_MS, 5000, 1000, 60000)
  const pingTimeoutMs = normalizePingMs(process.env.LIVESTORE_PING_TIMEOUT_MS, 2000, 1000, 60000)

  const storeDataPath = path.join(config.dataPath, config.storeId)

  const adapter = makeAdapter({
    storage: {
      type: 'fs',
      baseDirectory: storeDataPath,
    },
    sync: config.syncUrl
      ? {
          backend: makeWsSync({
            url: config.syncUrl,
            ping: {
              enabled: true,
              requestInterval: pingIntervalMs,
              requestTimeout: pingTimeoutMs,
            },
          }),
          onSyncError: 'shutdown',
        }
      : undefined,
  })

  const abortController = new AbortController()
  let timeoutId: NodeJS.Timeout | null = null
  let completed = false

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      if (completed) {
        return
      }
      abortController.abort()
      reject(
        new Error(
          `Store ${config.storeId} connection timeout after ${config.connectionTimeoutMs}ms`
        )
      )
    }, config.connectionTimeoutMs)
  })

  try {
    const store = await Promise.race([
      createStorePromise({
        adapter,
        schema: schema as any,
        storeId: config.storeId,
        syncPayload: getSyncPayload(config),
        signal: abortController.signal,
      }),
      timeoutPromise,
    ])

    completed = true
    return { store, config }
  } finally {
    completed = true
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}
