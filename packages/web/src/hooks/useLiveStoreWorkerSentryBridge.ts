import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/react'
import { nanoid } from '@livestore/utils/nanoid'
import {
  getWorkerSentryChannelNameFromStore,
  isLiveStoreWorkerLogPayload,
  type LiveStoreWorkerLogPayload,
} from '../utils/livestoreWorkerSentryBridge.js'

const shouldCapturePayload = (payload: LiveStoreWorkerLogPayload): boolean =>
  payload.level === 'error' || payload.level === 'warning'

const buildFingerprint = (payload: LiveStoreWorkerLogPayload, storeId: string) =>
  `${storeId}:${payload.level}:${payload.message}:${payload.cause ?? ''}`

const getOrCreateSessionId = (storeId: string): string => {
  if (typeof window === 'undefined') return 'unknown'
  if (typeof sessionStorage === 'undefined') return 'unknown'

  const key = `livestore:sessionId:${storeId}`
  const existing = sessionStorage.getItem(key)
  if (existing) return existing

  const next = nanoid(5)
  sessionStorage.setItem(key, next)
  return next
}

export const useLiveStoreWorkerSentryBridge = (storeId: string): void => {
  const lastFingerprintRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const sessionId = getOrCreateSessionId(storeId)
    const channelName = getWorkerSentryChannelNameFromStore(storeId, sessionId)
    lastFingerprintRef.current = null

    const channel = new BroadcastChannel(channelName)
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data
      if (!isLiveStoreWorkerLogPayload(payload)) return
      if (!shouldCapturePayload(payload)) return

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
