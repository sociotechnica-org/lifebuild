import { validateStoreId } from '../factories/store-factory.js'
import { operationLogger } from '../utils/logger.js'

export interface StoresConfig {
  storeIds: string[]
  connectionTimeout: number
  reconnectInterval: number
  maxReconnectAttempts: number
}

export function parseStoreIds(storeIdsEnv?: string): string[] {
  if (!storeIdsEnv || storeIdsEnv.trim() === '') {
    operationLogger('parse_store_ids').warn(
      'No STORE_IDS configured. Server will run without monitoring any stores.'
    )
    return []
  }

  const rawIds = storeIdsEnv
    .split(',')
    .map(id => id.trim())
    .filter(id => id.length > 0)

  const validIds: string[] = []
  const invalidIds: string[] = []

  for (const id of rawIds) {
    if (validateStoreId(id)) {
      validIds.push(id)
    } else {
      invalidIds.push(id)
    }
  }

  if (invalidIds.length > 0) {
    operationLogger('parse_store_ids').error({ invalidIds }, 'Invalid store IDs found and skipped')
  }

  if (validIds.length === 0 && rawIds.length > 0) {
    throw new Error('No valid store IDs found in STORE_IDS configuration')
  }

  const uniqueIds = Array.from(new Set(validIds))
  if (uniqueIds.length !== validIds.length) {
    operationLogger('parse_store_ids').warn('Duplicate store IDs found and removed')
  }

  operationLogger('parse_store_ids').info(
    { storeCount: uniqueIds.length, storeIds: uniqueIds },
    'Parsed valid store IDs'
  )
  return uniqueIds
}

export function loadStoresConfig(): StoresConfig {
  const storeIds = parseStoreIds(process.env.STORE_IDS)

  const connectionTimeout = Number(process.env.STORE_CONNECTION_TIMEOUT) || 30000
  const reconnectInterval = Number(process.env.STORE_RECONNECT_INTERVAL) || 5000
  const maxReconnectAttempts = Number(process.env.STORE_MAX_RECONNECT_ATTEMPTS) || 3

  if (connectionTimeout < 1000 || connectionTimeout > 300000) {
    operationLogger('load_stores_config').warn(
      {
        configuredTimeout: connectionTimeout,
        defaultTimeout: 30000,
        recommendedRange: '1s-300s',
      },
      'STORE_CONNECTION_TIMEOUT outside recommended range, using default'
    )
  }

  if (reconnectInterval < 1000 || reconnectInterval > 60000) {
    operationLogger('load_stores_config').warn(
      {
        configuredInterval: reconnectInterval,
        defaultInterval: 5000,
        recommendedRange: '1s-60s',
      },
      'STORE_RECONNECT_INTERVAL outside recommended range, using default'
    )
  }

  if (maxReconnectAttempts < 1 || maxReconnectAttempts > 10) {
    operationLogger('load_stores_config').warn(
      {
        configuredAttempts: maxReconnectAttempts,
        defaultAttempts: 3,
        recommendedRange: '1-10',
      },
      'STORE_MAX_RECONNECT_ATTEMPTS outside recommended range, using default'
    )
  }

  const config: StoresConfig = {
    storeIds,
    connectionTimeout:
      connectionTimeout >= 1000 && connectionTimeout <= 300000 ? connectionTimeout : 30000,
    reconnectInterval:
      reconnectInterval >= 1000 && reconnectInterval <= 60000 ? reconnectInterval : 5000,
    maxReconnectAttempts:
      maxReconnectAttempts >= 1 && maxReconnectAttempts <= 10 ? maxReconnectAttempts : 3,
  }

  operationLogger('load_stores_config').info(
    {
      storeCount: config.storeIds.length,
      connectionTimeout: config.connectionTimeout,
      reconnectInterval: config.reconnectInterval,
      maxReconnectAttempts: config.maxReconnectAttempts,
      storeIds: config.storeIds,
    },
    'Stores configuration loaded'
  )

  return config
}

export function getStoreSpecificEnvVar(storeId: string, setting: string): string | undefined {
  const envKey = `STORE_${storeId.toUpperCase().replace(/-/g, '_')}_${setting}`
  return process.env[envKey]
}

export function hasStoreSpecificConfig(storeId: string): boolean {
  const prefix = `STORE_${storeId.toUpperCase().replace(/-/g, '_')}_`
  return Object.keys(process.env).some(key => key.startsWith(prefix))
}
