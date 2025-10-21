import * as Sentry from '@sentry/react'

// DSN is set via VITE_SENTRY_DSN environment variable
// If not set, Sentry will not send events (which is fine for dev without config)
const environment = import.meta.env.MODE || 'development'
const sentryDsn = import.meta.env.VITE_SENTRY_DSN

// Read package version for release tracking
const packageVersion = import.meta.env.VITE_APP_VERSION || '0.1.0'

Sentry.init({
  dsn: sentryDsn,
  // Environment helps separate events in Sentry dashboard (development, staging, production)
  environment,
  // Release tracking helps identify which version had which errors
  release: `@work-squared/web@${packageVersion}`,
  // Use tunnel to proxy events through same domain, bypassing tracking prevention
  tunnel: '/sentry-tunnel',
  // Set tracesSampleRate based on environment
  // Lower sampling in production to reduce volume
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
  // Enable session replay in production for debugging
  replaysSessionSampleRate: environment === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: environment === 'production' ? 1.0 : 0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
})
