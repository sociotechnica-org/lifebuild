import { createStorePromise, type Store as LiveStore } from '@livestore/livestore'
import { makeAdapter } from '@livestore/adapter-node'
import { makeWsSync } from '@livestore/sync-cf/client'
import { schema } from '@lifebuild/shared/schema'
import path from 'path'
import fs from 'fs'
import Database from 'better-sqlite3'
import { logger } from '../utils/logger.js'

export interface StoreConfig {
  storeId: string
  syncUrl?: string
  dataPath?: string
  connectionTimeout?: number
  devtoolsUrl?: string
  enableDevtools?: boolean
}

const STORE_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-_]{2,63}$/

export function validateStoreId(storeId: string): boolean {
  if (!storeId || typeof storeId !== 'string') {
    return false
  }

  if (!STORE_ID_REGEX.test(storeId)) {
    logger.error(
      { storeId },
      'Invalid store ID format: Must be 3-64 characters, alphanumeric with hyphens/underscores.'
    )
    return false
  }

  return true
}

export function getStoreConfig(storeId: string): StoreConfig {
  const baseConfig: StoreConfig = {
    storeId,
    syncUrl: process.env.LIVESTORE_SYNC_URL || 'ws://localhost:8787',
    dataPath: process.env.STORE_DATA_PATH || './data',
    connectionTimeout: Number(process.env.STORE_CONNECTION_TIMEOUT) || 30000,
    devtoolsUrl: process.env.DEVTOOLS_URL || 'http://localhost:4300',
    enableDevtools:
      process.env.NODE_ENV !== 'production' && process.env.DISABLE_DEVTOOLS !== 'true',
  }

  const storeSpecificEnvPrefix = `STORE_${storeId.toUpperCase().replace(/-/g, '_')}_`
  const syncUrlKey = `${storeSpecificEnvPrefix}SYNC_URL`
  const dataPathKey = `${storeSpecificEnvPrefix}DATA_PATH`
  const devtoolsUrlKey = `${storeSpecificEnvPrefix}DEVTOOLS_URL`

  if (process.env[syncUrlKey]) {
    baseConfig.syncUrl = process.env[syncUrlKey]
  }
  if (process.env[dataPathKey]) {
    baseConfig.dataPath = process.env[dataPathKey]
  }
  if (process.env[devtoolsUrlKey]) {
    baseConfig.devtoolsUrl = process.env[devtoolsUrlKey]
  }

  return baseConfig
}

const EVENTLOG_PREFIX = 'eventlog@'

function findEventlogPath(storeDataPath: string, storeId: string): string | null {
  const candidateDirs = [storeDataPath, path.join(storeDataPath, storeId)]

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir)) continue
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile()) continue
      if (entry.name.startsWith(EVENTLOG_PREFIX) && entry.name.endsWith('.db')) {
        return path.join(dir, entry.name)
      }
    }
  }

  // Fall back to one-level deep search under storeDataPath
  if (fs.existsSync(storeDataPath)) {
    const entries = fs.readdirSync(storeDataPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dir = path.join(storeDataPath, entry.name)
      const nested = fs.readdirSync(dir, { withFileTypes: true })
      for (const file of nested) {
        if (!file.isFile()) continue
        if (file.name.startsWith(EVENTLOG_PREFIX) && file.name.endsWith('.db')) {
          return path.join(dir, file.name)
        }
      }
    }
  }

  return null
}

async function repairBackendHeadIfAhead(storeDataPath: string, storeId: string): Promise<void> {
  try {
    const eventlogPath = findEventlogPath(storeDataPath, storeId)
    if (!eventlogPath) {
      return
    }

    const db = new Database(eventlogPath)
    try {
      const headRow = db.prepare('select head from __livestore_sync_status').get() as
        | { head?: number }
        | undefined
      const localRow = db.prepare('select max(seqNumGlobal) as maxHead from eventlog').get() as
        | { maxHead?: number }
        | undefined

      if (!headRow) return

      const backendHead = headRow.head ?? 0
      const localHead = localRow?.maxHead ?? 0

      if (backendHead > localHead) {
        logger.warn(
          {
            storeId,
            backendHead,
            localHead,
            eventlogPath,
          },
          'Backend head ahead of local head; resetting backend head to local head for recovery'
        )
        db.prepare('update __livestore_sync_status set head = ?').run(localHead)
      }
    } finally {
      db.close()
    }
  } catch (error) {
    logger.warn({ storeId, error }, 'Failed to repair backend head before LiveStore boot')
  }
}

export const __test__ = {
  findEventlogPath,
  repairBackendHeadIfAhead,
}

/**
 * Creates the sync payload for server-worker authentication
 * Uses SERVER_BYPASS_TOKEN for both production and development
 * Always includes instanceId for workspace isolation
 */
function getSyncPayload(config: StoreConfig): Record<string, string> | undefined {
  const isProduction = process.env.NODE_ENV === 'production'
  const serverBypassToken = process.env.SERVER_BYPASS_TOKEN

  if (isProduction && !serverBypassToken) {
    throw new Error(
      'SERVER_BYPASS_TOKEN is required for production deployment but not configured. ' +
        'Please set this environment variable in your production environment.'
    )
  }

  if (serverBypassToken) {
    logger.info('Using server bypass authentication')
    return {
      serverBypass: serverBypassToken,
      instanceId: config.storeId, // Explicitly specify workspace for security
    }
  }

  // Development mode without SERVER_BYPASS_TOKEN - proceed without auth
  logger.info('No SERVER_BYPASS_TOKEN configured, proceeding without sync authentication')
  return undefined
}

function normalizePingMs(
  rawEnv: string | undefined,
  fallback: number,
  min: number,
  max: number,
  label: string
): number {
  if (rawEnv === undefined) return fallback
  const value = Number(rawEnv)
  if (!Number.isFinite(value) || value < min || value > max) {
    logger.warn({ value: rawEnv, min, max, label }, 'Invalid ping configuration, using fallback')
    return fallback
  }
  return value
}

export async function createStore(
  storeId: string,
  configOverrides?: Partial<StoreConfig>
): Promise<{ store: LiveStore; config: StoreConfig }> {
  if (!validateStoreId(storeId)) {
    throw new Error(`Invalid store ID: ${storeId}`)
  }

  const config: StoreConfig = {
    ...getStoreConfig(storeId),
    ...configOverrides,
  }

  logger.info(
    {
      storeId: config.storeId,
      syncUrl: config.syncUrl,
      dataPath: config.dataPath,
      devtoolsEnabled: config.enableDevtools,
      devtoolsUrl: config.enableDevtools ? config.devtoolsUrl : 'disabled',
    },
    `Creating store ${storeId}`
  )

  const pingIntervalMs = normalizePingMs(
    process.env.LIVESTORE_PING_INTERVAL_MS,
    5000,
    1000,
    60000,
    'LIVESTORE_PING_INTERVAL_MS'
  )
  const pingTimeoutMs = normalizePingMs(
    process.env.LIVESTORE_PING_TIMEOUT_MS,
    2000,
    1000,
    60000,
    'LIVESTORE_PING_TIMEOUT_MS'
  )
  if (pingTimeoutMs >= pingIntervalMs) {
    logger.warn(
      { pingIntervalMs, pingTimeoutMs },
      'Ping timeout should be less than interval to allow response before next ping'
    )
  }

  const storeDataPath = path.join(config.dataPath!, storeId)

  if (process.env.LIVESTORE_REPAIR_BACKEND_HEAD !== 'false') {
    await repairBackendHeadIfAhead(storeDataPath, storeId)
  }

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
    devtools: config.enableDevtools
      ? {
          schemaPath: '../shared/src/livestore/schema.ts',
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
      reject(new Error(`Store ${storeId} connection timeout after ${config.connectionTimeout}ms`))
    }, config.connectionTimeout)
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
    logger.info({ storeId }, 'Store created successfully')
    return { store, config }
  } catch (error) {
    abortController.abort()
    logger.error({ storeId, error }, 'Failed to create store')
    throw error
  } finally {
    completed = true
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

export class StoreFactory {
  private readonly defaultConfig: Partial<StoreConfig>

  constructor(defaultConfig?: Partial<StoreConfig>) {
    this.defaultConfig = defaultConfig || {}
  }

  async create(storeId: string, configOverrides?: Partial<StoreConfig>): Promise<LiveStore> {
    const mergedConfig = {
      ...this.defaultConfig,
      ...configOverrides,
    }
    const { store } = await createStore(storeId, mergedConfig)
    return store
  }

  validate(storeId: string): boolean {
    return validateStoreId(storeId)
  }

  getConfig(storeId: string): StoreConfig {
    return {
      ...getStoreConfig(storeId),
      ...this.defaultConfig,
    }
  }
}

export const defaultStoreFactory = new StoreFactory()
