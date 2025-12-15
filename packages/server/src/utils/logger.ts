import pino from 'pino'
import { AsyncLocalStorage } from 'async_hooks'

// Async local storage for correlation ID propagation
const correlationStorage = new AsyncLocalStorage<string>()

// Determine log level based on environment
function getLogLevel(): pino.Level {
  const env = process.env.NODE_ENV
  const level = process.env.LOG_LEVEL

  if (level) {
    return level as pino.Level
  }

  switch (env) {
    case 'test':
      return 'warn' // Only show warnings and errors in tests
    case 'production':
      return 'info'
    default:
      return 'debug' // Development
  }
}

// Determine transport configuration
function getTransport() {
  const env = process.env.NODE_ENV
  const sentryDsn = process.env.SENTRY_DSN

  // Build transports array
  const transports: Array<{ target: string; options: any; level?: string }> = []

  // Add Sentry transport if DSN is configured
  if (sentryDsn) {
    transports.push({
      target: 'pino-sentry-transport',
      options: {
        sentry: {
          dsn: sentryDsn,
          environment: env || 'development',
        },
        // Only send warnings and errors to Sentry to reduce noise
        minLevel: 'warn',
      },
      level: 'warn',
    })
  }

  // Add pretty printing for development/test
  if (env !== 'production') {
    transports.push({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    })
  } else if (transports.length > 0) {
    // Production with other transports (e.g., Sentry): add stdout explicitly
    // so logs appear in Render/cloud logging platforms
    transports.push({
      target: 'pino/file',
      options: { destination: 1 }, // 1 = stdout
    })
  }

  // Return transport configuration
  // If we have multiple transports, return as array
  // If only one transport, return it directly
  // If no transports, return undefined (JSON output)
  if (transports.length > 1) {
    return {
      targets: transports,
    }
  } else if (transports.length === 1) {
    return transports[0]
  }

  return undefined
}

// Create the base logger
export const logger = pino({
  level: getLogLevel(),
  transport: getTransport(),
  base: {
    service: 'lifebuild-server',
    version: process.env.npm_package_version || '0.1.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label: string) => {
      return { level: label }
    },
  },
})

// Helper function to create context-aware child loggers
export function createContextLogger(context: {
  storeId?: string
  operation?: string
  conversationId?: string
  messageId?: string
  userId?: string
  [key: string]: any
}) {
  return logger.child(context)
}

// Convenience methods for common operations
export const storeLogger = (storeId: string) => createContextLogger({ storeId })
export const operationLogger = (operation: string, context: object = {}) =>
  createContextLogger({ operation, ...context })

/**
 * Get the current correlation ID from async local storage
 */
export function getCurrentCorrelationId(): string | undefined {
  return correlationStorage.getStore()
}

/**
 * Run a function with a correlation ID in context.
 * All logs within the callback will automatically include the correlation ID.
 */
export function withCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationStorage.run(correlationId, fn)
}

/**
 * Run an async function with a correlation ID in context.
 * All logs within the callback will automatically include the correlation ID.
 */
export async function withCorrelationIdAsync<T>(
  correlationId: string,
  fn: () => Promise<T>
): Promise<T> {
  return correlationStorage.run(correlationId, fn)
}

/**
 * Create a logger that includes correlation ID automatically.
 * Uses the correlation ID from async local storage if available,
 * or accepts an explicit correlation ID.
 */
export function createCorrelatedLogger(context: {
  correlationId?: string
  storeId?: string
  messageId?: string
  conversationId?: string
  operation?: string
  stage?: string
  [key: string]: unknown
}) {
  const currentCorrelationId = context.correlationId || getCurrentCorrelationId()

  return logger.child({
    ...context,
    ...(currentCorrelationId ? { correlationId: currentCorrelationId } : {}),
  })
}

/**
 * Log a message processing event with structured data.
 * This creates consistent log entries for message lifecycle events.
 */
export function logMessageEvent(
  level: 'debug' | 'info' | 'warn' | 'error',
  event: {
    correlationId: string
    messageId: string
    storeId: string
    conversationId?: string
    stage: string
    action: string
    durationMs?: number
    iteration?: number
    toolNames?: string[]
    error?: string
    [key: string]: unknown
  },
  message: string
): void {
  const log = createCorrelatedLogger({
    correlationId: event.correlationId,
    messageId: event.messageId,
    storeId: event.storeId,
    conversationId: event.conversationId,
    stage: event.stage,
  })

  const logData: Record<string, unknown> = {
    action: event.action,
  }

  if (event.durationMs !== undefined) logData.durationMs = event.durationMs
  if (event.iteration !== undefined) logData.iteration = event.iteration
  if (event.toolNames !== undefined) logData.toolNames = event.toolNames
  if (event.error !== undefined) logData.error = event.error

  // Include any additional properties
  for (const [key, value] of Object.entries(event)) {
    if (
      ![
        'correlationId',
        'messageId',
        'storeId',
        'conversationId',
        'stage',
        'action',
        'durationMs',
        'iteration',
        'toolNames',
        'error',
      ].includes(key)
    ) {
      logData[key] = value
    }
  }

  log[level](logData, message)
}

// Export the configured logger as default
export default logger
