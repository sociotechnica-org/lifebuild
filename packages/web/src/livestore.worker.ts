import { makeWorker } from '@livestore/adapter-web/worker'
import { makeWsSync } from '@livestore/sync-cf/client'
import { Logger } from '@livestore/utils/effect'

import { schema } from '@lifebuild/shared/schema'
import { makeTracer } from './otel.js'
import {
  LIVESTORE_SENTRY_CHANNEL,
  type LiveStoreWorkerLogPayload,
} from './utils/livestoreWorkerSentryBridge.js'

const formatDate = (date: Date): string =>
  `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date
    .getMilliseconds()
    .toString()
    .padStart(3, '0')}`

const toMessageString = (message: unknown): string => {
  if (typeof message === 'string') return message
  if (message instanceof Error) return message.message
  if (Array.isArray(message)) return message.map(toMessageString).join(' ')
  try {
    return JSON.stringify(message)
  } catch {
    return String(message)
  }
}

const toStack = (message: unknown): string | undefined => {
  if (message instanceof Error) return message.stack
  if (Array.isArray(message)) {
    for (const entry of message) {
      if (entry instanceof Error && entry.stack) {
        return entry.stack
      }
    }
  }
  return undefined
}

const toCauseString = (cause: unknown): string | undefined => {
  if (cause == null) return undefined
  if (typeof cause === 'string') return cause
  if (cause instanceof Error) return cause.stack ?? cause.message
  try {
    return JSON.stringify(cause)
  } catch {
    return String(cause)
  }
}

const sentryChannel =
  typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(LIVESTORE_SENTRY_CHANNEL)

const sentryLogger = Logger.make(({ message, logLevel, date, cause }) => {
  const levelTag = logLevel._tag
  if (levelTag !== 'Warning' && levelTag !== 'Error' && levelTag !== 'Fatal') return
  if (!sentryChannel) return

  const payload: LiveStoreWorkerLogPayload = {
    source: 'livestore-worker',
    level: levelTag === 'Warning' ? 'warning' : 'error',
    message: toMessageString(message),
    timestamp: date.getTime(),
    stack: toStack(message),
    annotations: { thread: self.name || 'worker' },
    ...(cause ? { cause: toCauseString(cause) } : {}),
  }

  try {
    sentryChannel.postMessage(payload)
  } catch {
    // Ignore channel errors to avoid crashing the worker.
  }
})

const prettyLogger = Logger.prettyLogger({
  mode: 'browser',
  formatDate: date => `${formatDate(date)} ${self.name || 'worker'}`,
})

const workerLogger = Logger.replace(Logger.defaultLogger, Logger.zip(prettyLogger, sentryLogger))

const getSyncUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_LIVESTORE_SYNC_URL) {
    return import.meta.env.VITE_LIVESTORE_SYNC_URL
  }

  // Fallback to localhost for development
  if (self.location && self.location.hostname === 'localhost') {
    return 'ws://localhost:8787'
  }

  // Production fallback
  return `wss://${self.location.host}`
}

makeWorker({
  schema,
  sync: {
    backend: makeWsSync({
      url: getSyncUrl(),
      ping: {
        enabled: true,
        requestTimeout: 5000,
        requestInterval: 15000,
      },
    }),
    initialSyncOptions: { _tag: 'Blocking', timeout: 5000 },
  },
  otelOptions: { tracer: makeTracer('lifebuild-worker') },
  logger: workerLogger,
})
