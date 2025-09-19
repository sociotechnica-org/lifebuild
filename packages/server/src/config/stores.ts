import { validateStoreId } from '../factories/store-factory.js'
import { logger } from '../utils/logger.js'

export interface StoresConfig {
  storeIds: string[]
  connectionTimeout: number
  reconnectInterval: number
  maxReconnectAttempts: number
}

export function parseStoreIds(storeIdsEnv?: string): string[] {
  if (!storeIdsEnv || storeIdsEnv.trim() === '') {
    logger.warn('⚠️ No STORE_IDS configured. Server will run without monitoring any stores.')
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
    logger.error(`❌ Invalid store IDs found and skipped: ${invalidIds.join(', ')}`)
  }

  if (validIds.length === 0 && rawIds.length > 0) {
    throw new Error('No valid store IDs found in STORE_IDS configuration')
  }

  const uniqueIds = Array.from(new Set(validIds))
  if (uniqueIds.length !== validIds.length) {
    logger.warn('⚠️ Duplicate store IDs found and removed')
  }

  logger.log(`✅ Parsed ${uniqueIds.length} valid store IDs: ${uniqueIds.join(', ')}`)
  return uniqueIds
}

export function loadStoresConfig(): StoresConfig {
  const storeIds = parseStoreIds(process.env.STORE_IDS)

  const connectionTimeout = Number(process.env.STORE_CONNECTION_TIMEOUT) || 30000
  const reconnectInterval = Number(process.env.STORE_RECONNECT_INTERVAL) || 5000
  const maxReconnectAttempts = Number(process.env.STORE_MAX_RECONNECT_ATTEMPTS) || 3

  if (connectionTimeout < 1000 || connectionTimeout > 300000) {
    logger.warn(
      `⚠️ STORE_CONNECTION_TIMEOUT ${connectionTimeout}ms is outside recommended range (1s-300s). Using default 30s.`
    )
  }

  if (reconnectInterval < 1000 || reconnectInterval > 60000) {
    logger.warn(
      `⚠️ STORE_RECONNECT_INTERVAL ${reconnectInterval}ms is outside recommended range (1s-60s). Using default 5s.`
    )
  }

  if (maxReconnectAttempts < 1 || maxReconnectAttempts > 10) {
    logger.warn(
      `⚠️ STORE_MAX_RECONNECT_ATTEMPTS ${maxReconnectAttempts} is outside recommended range (1-10). Using default 3.`
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

  logger.log('📋 Stores configuration loaded:', {
    storeCount: config.storeIds.length,
    connectionTimeout: `${config.connectionTimeout}ms`,
    reconnectInterval: `${config.reconnectInterval}ms`,
    maxReconnectAttempts: config.maxReconnectAttempts,
  })

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
