import * as Sentry from '@sentry/node'

// DSN should be set via environment variable before this module is imported
// If not set, Sentry will not send events (which is fine for dev without config)
const environment = process.env.NODE_ENV || 'development'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Environment helps separate events in Sentry dashboard (development, staging, production)
  environment,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Enable logging
  enableLogs: true,
  // Add console logging integration
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
  ],
  // Set tracesSampleRate based on environment
  // 100% sampling in dev/staging, lower in production to reduce volume
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
})
