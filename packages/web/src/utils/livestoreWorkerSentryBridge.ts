export const LIVESTORE_SENTRY_CHANNEL = 'lifebuild-livestore-sentry'

export type LiveStoreWorkerLogPayload = {
  source: 'livestore-worker'
  level: 'error' | 'warning'
  message: string
  timestamp: number
  cause?: string
  stack?: string
  workerName?: string
  annotations?: Record<string, unknown>
}

export const isLiveStoreWorkerLogPayload = (value: unknown): value is LiveStoreWorkerLogPayload => {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  if (payload.source !== 'livestore-worker') return false
  if (payload.level !== 'error' && payload.level !== 'warning') return false
  if (typeof payload.message !== 'string') return false
  if (typeof payload.timestamp !== 'number') return false
  return true
}

export const getLiveStoreWorkerName = (storeId: string, sessionId: string): string =>
  `livestore-worker-${storeId}-${sessionId}`
