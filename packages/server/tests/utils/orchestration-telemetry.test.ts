import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as Sentry from '@sentry/node'
import { createOrchestrationTelemetry } from '../../src/utils/orchestration-telemetry.js'

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
})
