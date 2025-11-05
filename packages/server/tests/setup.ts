import { vi } from 'vitest'

// Mock pino module
vi.mock('pino', () => {
  const mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(function() { return this }),
  }

  const pino = vi.fn(() => mockLogger)
  pino.stdTimeFunctions = {
    isoTime: vi.fn(),
  }

  return {
    default: pino,
    pino: pino,
  }
})

// Mock pino-pretty module
vi.mock('pino-pretty', () => ({
  default: vi.fn(),
}))

vi.mock('@sentry/node', () => {
  const mockScope = {
    setTag: vi.fn(),
    setContext: vi.fn(),
    setLevel: vi.fn(),
  }

  return {
    init: vi.fn(),
    addBreadcrumb: vi.fn(),
    withScope: (callback: (scope: typeof mockScope) => unknown) => callback(mockScope),
    captureException: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
    consoleLoggingIntegration: vi.fn(),
  }
})
