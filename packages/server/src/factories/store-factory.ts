import { createStorePromise, type Store as LiveStore } from '@livestore/livestore'
import { makeAdapter } from '@livestore/adapter-node'
import { makeCfSync } from '@livestore/sync-cf'
import { schema } from '@work-squared/shared/schema'
import path from 'path'
import { logger } from '../utils/logger.js'

export interface StoreConfig {
  storeId: string
  authToken?: string
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
    authToken: process.env.AUTH_TOKEN || `token-${storeId}`,
    syncUrl: process.env.LIVESTORE_SYNC_URL || 'ws://localhost:8787',
    dataPath: process.env.STORE_DATA_PATH || './data',
    connectionTimeout: Number(process.env.STORE_CONNECTION_TIMEOUT) || 30000,
    devtoolsUrl: process.env.DEVTOOLS_URL || 'http://localhost:4300',
    enableDevtools:
      process.env.NODE_ENV !== 'production' && process.env.DISABLE_DEVTOOLS !== 'true',
  }

  const storeSpecificEnvPrefix = `STORE_${storeId.toUpperCase().replace(/-/g, '_')}_`
  const authTokenKey = `${storeSpecificEnvPrefix}AUTH_TOKEN`
  const syncUrlKey = `${storeSpecificEnvPrefix}SYNC_URL`
  const dataPathKey = `${storeSpecificEnvPrefix}DATA_PATH`
  const devtoolsUrlKey = `${storeSpecificEnvPrefix}DEVTOOLS_URL`

  if (process.env[authTokenKey]) {
    baseConfig.authToken = process.env[authTokenKey]
  }
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

/**
 * Creates the sync payload for server-worker authentication
 * Uses serverBypass in production, authToken in development
 */
function getSyncPayload(config: StoreConfig): Record<string, string> | undefined {
  const isProduction = process.env.NODE_ENV === 'production'
  const serverBypassToken = process.env.SERVER_BYPASS_TOKEN

  if (isProduction) {
    if (!serverBypassToken) {
      throw new Error(
        'SERVER_BYPASS_TOKEN is required for production deployment but not configured. ' +
          'Please set this environment variable in your production environment.'
      )
    }
    logger.info('Using server bypass authentication for production')
    return {
      serverBypass: serverBypassToken,
    }
  }

  // Development mode - use authToken
  if (config.authToken) {
    logger.info('Using authToken authentication for development')
    return {
      authToken: config.authToken,
    }
  }

  return undefined
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

  const storeDataPath = path.join(config.dataPath!, storeId)

  const adapter = makeAdapter({
    storage: {
      type: 'fs',
      baseDirectory: storeDataPath,
    },
    sync: config.syncUrl
      ? {
          backend: makeCfSync({ url: config.syncUrl }),
          onSyncError: 'shutdown', // Revert to original behavior
        }
      : undefined,
    devtools: config.enableDevtools
      ? {
          schemaPath: '../shared/src/livestore/schema.ts',
        }
      : undefined,
  })

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
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
      }),
      timeoutPromise,
    ])

    logger.info({ storeId }, 'Store created successfully')
    return { store, config }
  } catch (error) {
    logger.error({ storeId, error }, 'Failed to create store')
    throw error
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
