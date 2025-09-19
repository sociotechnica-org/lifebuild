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