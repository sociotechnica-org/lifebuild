import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/react'
import {
  LIVESTORE_SENTRY_CHANNEL,
  isLiveStoreWorkerLogPayload,
  type LiveStoreWorkerLogPayload,
} from '../utils/livestoreWorkerSentryBridge.js'

const shouldCapturePayload = (payload: LiveStoreWorkerLogPayload): boolean =>
  payload.level === 'error' || payload.level === 'warning'

const buildFingerprint = (payload: LiveStoreWorkerLogPayload) =>
  `${payload.level}:${payload.message}:${payload.cause ?? ''}`

export const useLiveStoreWorkerSentryBridge = (storeId: string): void => {
  const lastFingerprintRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return

    const channel = new BroadcastChannel(LIVESTORE_SENTRY_CHANNEL)
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data
      if (!isLiveStoreWorkerLogPayload(payload)) return
      if (!shouldCapturePayload(payload)) return

      const fingerprint = buildFingerprint(payload)
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
