import pino from 'pino'

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

  if (env === 'production') {
    // In production, use JSON format for structured logging (ready for Axiom)
    return undefined
  }

  // In development/test, use pretty printing for readability
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  }
}

// Create the base logger
export const logger = pino({
  level: getLogLevel(),
  transport: getTransport(),
  base: {
    service: 'work-squared-server',
    version: process.env.npm_package_version || '0.1.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => {
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

// For backward compatibility during migration, we can also export individual methods
export const logInfo = (message: string, context?: object) => logger.info(context, message)
export const logWarn = (message: string, context?: object) => logger.warn(context, message)
export const logError = (message: string, context?: object) => logger.error(context, message)
export const logDebug = (message: string, context?: object) => logger.debug(context, message)

// Export the configured logger as default
export default logger
