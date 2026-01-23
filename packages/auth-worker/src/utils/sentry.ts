import * as Sentry from '@sentry/cloudflare'

/**
 * Reports a configuration error to Sentry.
 * Use this for missing required configuration that should be visible in monitoring.
 */
export function reportConfigurationError(message: string, context?: Record<string, unknown>): void {
  Sentry.captureException(new Error(message), {
    tags: { type: 'configuration_error' },
    extra: context,
  })
}
