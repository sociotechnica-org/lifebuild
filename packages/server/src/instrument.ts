import * as Sentry from '@sentry/node'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// DSN should be set via environment variable before this module is imported
// If not set, Sentry will not send events (which is fine for dev without config)
const environment = process.env.NODE_ENV || 'development'

// Read package version for release tracking
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'))

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Environment helps separate events in Sentry dashboard (development, staging, production)
  environment,
  // Release tracking helps identify which version had which errors
  release: `${packageJson.name}@${packageJson.version}`,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  // Enable Sentry Logs feature (structured logging)
  enableLogs: true,
  // Add integrations for logging
  integrations: [
    // Pino integration sends pino logs to Sentry Logs (requires SDK 10.18.0+)
    // This automatically instruments pino loggers created after Sentry.init()
    Sentry.pinoIntegration(),
  ],
  // Set tracesSampleRate based on environment
  // 100% sampling in dev/staging, lower in production to reduce volume
  tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
})
