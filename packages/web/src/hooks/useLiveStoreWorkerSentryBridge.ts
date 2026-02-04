import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/react'
import { nanoid } from '@livestore/utils/nanoid'
import {
  getLiveStoreWorkerName,
  LIVESTORE_SENTRY_CHANNEL,
  isLiveStoreWorkerLogPayload,
  type LiveStoreWorkerLogPayload,
} from '../utils/livestoreWorkerSentryBridge.js'

const shouldCapturePayload = (payload: LiveStoreWorkerLogPayload): boolean =>
  payload.level === 'error' || payload.level === 'warning'

const buildFingerprint = (payload: LiveStoreWorkerLogPayload, storeId: string) =>
  `${storeId}:${payload.level}:${payload.message}:${payload.cause ?? ''}`

const getOrCreateSessionId = (storeId: string): string | null => {
  if (typeof window === 'undefined') return null
  if (typeof sessionStorage === 'undefined') return null

  const key = `livestore:sessionId:${storeId}`
  try {
    const existing = sessionStorage.getItem(key)
    if (existing) return existing

    const next = nanoid(5)
    sessionStorage.setItem(key, next)
    return next
  } catch {
    return null
  }
}

export const useLiveStoreWorkerSentryBridge = (storeId: string): void => {
  const lastFingerprintRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const sessionId = getOrCreateSessionId(storeId)
    if (!sessionId) return
    const expectedWorkerName = getLiveStoreWorkerName(storeId, sessionId)
    lastFingerprintRef.current = null

    const channel = new BroadcastChannel(LIVESTORE_SENTRY_CHANNEL)
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data
      if (!isLiveStoreWorkerLogPayload(payload)) return
      if (!shouldCapturePayload(payload)) return
      if (payload.workerName !== expectedWorkerName) return

      const fingerprint = buildFingerprint(payload, storeId)
      if (fingerprint === lastFingerprintRef.current) return
      lastFingerprintRef.current = fingerprint

      const error = new Error(payload.message)
      if (payload.stack) {
        error.stack = payload.stack
      }

      Sentry.withScope(scope => {
        scope.setLevel(payload.level)
        scope.setTag('livestore', 'worker')
        scope.setTag('livestore.storeId', storeId)
        if (payload.workerName) {
          scope.setTag('livestore.workerName', payload.workerName)
        }
        scope.setContext('livestoreWorker', {
          cause: payload.cause,
          timestamp: payload.timestamp,
          annotations: payload.annotations,
        })
        Sentry.captureException(error)
      })
    }

    channel.addEventListener('message', handleMessage)

    return () => {
      channel.removeEventListener('message', handleMessage)
      channel.close()
    }
  }, [storeId])
}
