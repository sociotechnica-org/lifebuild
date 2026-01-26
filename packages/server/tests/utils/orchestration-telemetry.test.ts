import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as Sentry from '@sentry/node'
import {
  createOrchestrationTelemetry,
  unwrapErrorForSentry,
} from '../../src/utils/orchestration-telemetry.js'

describe('orchestration telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records success and adds Sentry breadcrumbs', () => {
    const telemetry = createOrchestrationTelemetry({
      operation: 'test.operation',
      metadata: { example: 'value' },
    })

    const { durationMs, breadcrumbData } = telemetry.recordSuccess({ status: 'ok' })

    expect(durationMs).toBeGreaterThanOrEqual(0)
    expect(breadcrumbData.status).toBe('success')
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'test.operation started' })
    )
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'test.operation succeeded' })
    )
  })

  it('captures failures when configured', () => {
    const telemetry = createOrchestrationTelemetry({
      operation: 'test.failure',
      captureOnError: true,
    })

    const error = new Error('boom')
    const { durationMs, breadcrumbData } = telemetry.recordFailure(error, { reason: 'test' })

    expect(durationMs).toBeGreaterThanOrEqual(0)
    expect(breadcrumbData.status).toBe('error')
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'test.failure failed' })
    )
    expect(Sentry.captureException).toHaveBeenCalledWith(error)
  })

  it('unwraps FiberFailure errors when capturing to Sentry', () => {
    const telemetry = createOrchestrationTelemetry({
      operation: 'test.fiberfailure',
      captureOnError: true,
    })

    const originalError = new Error('This should never happen: backend head issue')
    const fiberFailure = {
      _id: 'FiberFailure',
      cause: {
        _id: 'Cause',
        _tag: 'Fail',
        failure: {
          _tag: 'LiveStore.UnknownError',
          cause: originalError,
        },
      },
    }

    telemetry.recordFailure(fiberFailure, { reason: 'test' })

    // Should capture the unwrapped error, not the FiberFailure wrapper
    expect(Sentry.captureException).toHaveBeenCalledWith(originalError)
  })
})

describe('unwrapErrorForSentry', () => {
  it('returns standard Error unchanged', () => {
    const error = new Error('standard error')
    expect(unwrapErrorForSentry(error)).toBe(error)
  })

  it('unwraps FiberFailure with nested Error cause', () => {
    const originalError = new Error('nested error')
    const fiberFailure = {
      _id: 'FiberFailure',
      cause: {
        _id: 'Cause',
        _tag: 'Fail',
        failure: {
          _tag: 'LiveStore.UnknownError',
          cause: originalError,
        },
      },
    }

    expect(unwrapErrorForSentry(fiberFailure)).toBe(originalError)
  })

  it('unwraps FiberFailure defects', () => {
    const defectError = new Error('defect error')
    const fiberFailure = {
      _id: 'FiberFailure',
      cause: {
        _id: 'Cause',
        _tag: 'Die',
        defect: defectError,
      },
    }

    expect(unwrapErrorForSentry(fiberFailure)).toBe(defectError)
  })

  it('unwraps FiberFailure when failure is directly an Error (Effect.fail(new Error(...)))', () => {
    const directError = new Error('direct error from Effect.fail')
    const fiberFailure = {
      _id: 'FiberFailure',
      cause: {
        _id: 'Cause',
        _tag: 'Fail',
        failure: directError, // failure IS the Error, not a wrapper
      },
    }

    expect(unwrapErrorForSentry(fiberFailure)).toBe(directError)
  })

  it('creates Error from failure tag when cause is not an Error', () => {
    const fiberFailure = {
      _id: 'FiberFailure',
      cause: {
        _id: 'Cause',
        _tag: 'Fail',
        failure: {
          _tag: 'LiveStore.UnknownError',
          cause: { message: 'something went wrong' },
        },
      },
    }

    const result = unwrapErrorForSentry(fiberFailure)
    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toBe('something went wrong')
    expect((result as Error).name).toBe('LiveStore.UnknownError')
  })

  it('returns non-FiberFailure objects unchanged', () => {
    const obj = { some: 'object' }
    expect(unwrapErrorForSentry(obj)).toBe(obj)
  })

  it('returns primitives unchanged', () => {
    expect(unwrapErrorForSentry('string error')).toBe('string error')
    expect(unwrapErrorForSentry(42)).toBe(42)
    expect(unwrapErrorForSentry(null)).toBe(null)
  })
})
