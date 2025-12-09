// Load environment variables FIRST, before anything else (including Sentry)
import dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageRoot = resolve(__dirname, '..')
dotenv.config({ path: resolve(packageRoot, '.env') })

// IMPORTANT: Import Sentry instrumentation after env vars are loaded
// Using dynamic import to ensure it happens after dotenv.config()
await import('./instrument.js')
import * as Sentry from '@sentry/node'

import { storeManager } from './services/store-manager.js'
import { EventProcessor } from './services/event-processor.js'
import { WorkspaceOrchestrator } from './services/workspace-orchestrator.js'
import {
  AuthWorkerWorkspaceDirectory,
  type WorkspaceDirectory,
} from './services/workspace-directory.js'
import { loadStoresConfig } from './config/stores.js'
import { logger } from './utils/logger.js'
import { handleWorkspaceWebhook } from './api/workspace-webhooks.js'
import {
  WorkspaceReconciler,
  getDisabledReconcilerStatus,
  type WorkspaceReconcilerStatus,
} from './services/workspace-reconciler.js'

async function main() {
  logger.info('Starting LifeBuild Multi-Store Server...')

  const config = loadStoresConfig()

  await storeManager.initialize(config.storeIds)

  if (config.storeIds.length === 0) {
    logger.warn('No stores configured. Server running in monitoring mode only.')
  }

  // Set up event processor
  const eventProcessor = new EventProcessor(storeManager)
  const workspaceOrchestrator = new WorkspaceOrchestrator(storeManager, eventProcessor)
  const webhookSecret = process.env.WEBHOOK_SECRET

  if (!webhookSecret) {
    logger.warn('WEBHOOK_SECRET not configured. Workspace webhooks will be rejected.')
  }

  // Start monitoring all stores (legacy bootstrap support)
  for (const storeId of config.storeIds) {
    await workspaceOrchestrator.ensureMonitored(storeId)
  }

  logger.info('Event monitoring started for all stores')

  const authWorkerUrl =
    process.env.AUTH_WORKER_INTERNAL_URL || process.env.AUTH_WORKER_URL || undefined
  const serverBypassToken = process.env.SERVER_BYPASS_TOKEN
  const reconcileIntervalRaw = Number(process.env.WORKSPACE_RECONCILE_INTERVAL_MS)
  const reconcileInterval = Number.isFinite(reconcileIntervalRaw) ? reconcileIntervalRaw : undefined

  let workspaceReconciler: WorkspaceReconciler | null = null
  let disabledReconcilerStatus: WorkspaceReconcilerStatus | null = null

  if (authWorkerUrl && serverBypassToken) {
    const directory: WorkspaceDirectory = new AuthWorkerWorkspaceDirectory({
      baseUrl: authWorkerUrl,
      serverBypassToken,
    })
    workspaceReconciler = new WorkspaceReconciler({
      orchestrator: workspaceOrchestrator,
      directory,
      intervalMs: reconcileInterval,
    })
    workspaceReconciler.start()
  } else {
    const reason = !authWorkerUrl
      ? 'AUTH_WORKER_INTERNAL_URL not configured'
      : 'SERVER_BYPASS_TOKEN not configured'
    disabledReconcilerStatus = getDisabledReconcilerStatus(reason)
  }

  const http = await import('http')
  const healthServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    const pathname = req.url?.split('?')[0] ?? ''

    if (pathname === '/webhooks/workspaces') {
      await handleWorkspaceWebhook(req, res, {
        orchestrator: workspaceOrchestrator,
        secret: webhookSecret,
      })
      return
    }

    if (pathname === '/health') {
      const healthStatus = storeManager.getHealthStatus()
      const processingStats = eventProcessor.getProcessingStats()
      const liveStoreStats = await eventProcessor.getLiveStoreStats()
      const globalResourceStatus = eventProcessor.getGlobalResourceStatus({
        pendingUserMessages: liveStoreStats.totals.pendingUserMessages,
        userMessages: liveStoreStats.totals.userMessages,
      })
      const processedStats = await eventProcessor.getProcessedMessageStats()
      const orchestratorSummary = workspaceOrchestrator.getSummary()
      const reconciliationStatus: WorkspaceReconcilerStatus = workspaceReconciler
        ? workspaceReconciler.getStatus()
        : (disabledReconcilerStatus ??
          getDisabledReconcilerStatus('Workspace reconciler not configured'))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: healthStatus.healthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          storage: 'filesystem',
          dataPath: process.env.STORE_DATA_PATH || './data',
          stores: healthStatus.stores.map(store => ({
            ...store,
            processing: processingStats.get(store.storeId) || null,
            liveStore: liveStoreStats.perStore.get(store.storeId) || null,
          })),
          storeCount: healthStatus.stores.length,
          globalResources: globalResourceStatus,
          liveStoreTotals: liveStoreStats.totals,
          liveStorePerStore: Object.fromEntries(liveStoreStats.perStore),
          processedMessages: processedStats,
          orchestrator: orchestratorSummary,
          reconciliation: reconciliationStatus,
        })
      )
    } else if (pathname === '/stores') {
      const storeInfo = storeManager.getAllStoreInfo()
      const processingStats = eventProcessor.getProcessingStats()
      const orchestratorSummary = workspaceOrchestrator.getSummary()
      const reconciliationStatus: WorkspaceReconcilerStatus = workspaceReconciler
        ? workspaceReconciler.getStatus()
        : (disabledReconcilerStatus ??
          getDisabledReconcilerStatus('Workspace reconciler not configured'))
      const stores = Array.from(storeInfo.entries()).map(([id, info]) => ({
        id,
        status: info.status,
        connectedAt: info.connectedAt.toISOString(),
        lastActivity: info.lastActivity.toISOString(),
        errorCount: info.errorCount,
        reconnectAttempts: info.reconnectAttempts,
        processing: processingStats.get(id) || null,
        orchestrator: orchestratorSummary.stores.find(store => store.storeId === id) || null,
      }))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          stores,
          orchestrator: {
            monitoredStoreIds: orchestratorSummary.monitoredStoreIds,
            lastProvisionedAt: orchestratorSummary.lastProvisionedAt,
            lastDeprovisionedAt: orchestratorSummary.lastDeprovisionedAt,
            totalProvisioned: orchestratorSummary.totalProvisioned,
            totalDeprovisioned: orchestratorSummary.totalDeprovisioned,
          },
          reconciliation: reconciliationStatus,
        })
      )
    } else if (pathname === '/') {
      const healthStatus = storeManager.getHealthStatus()

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`
        <html>
          <head>
            <title>LifeBuild Multi-Store Server</title>
            <style>
              body { font-family: system-ui; padding: 20px; }
              .store { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
              .healthy { background: #e8f5e9; }
              .degraded { background: #fff3e0; }
              .error { background: #ffebee; }
              .status-connected { color: green; }
              .status-connecting { color: orange; }
              .status-disconnected { color: red; }
              .status-error { color: darkred; }
            </style>
          </head>
          <body>
            <h1>LifeBuild Multi-Store Server</h1>
            <p>✅ Server is running</p>
            <p>Storage: Filesystem (${process.env.STORE_DATA_PATH || './data'})</p>
            <p>Monitoring ${healthStatus.stores.length} store(s)</p>
            
            <h2>Store Status</h2>
            <div id="stores">
              ${
                healthStatus.stores.length === 0
                  ? '<p>No stores configured</p>'
                  : healthStatus.stores
                      .map(
                        store => `
                        <div class="store ${store.status === 'connected' ? 'healthy' : store.status === 'connecting' ? 'degraded' : 'error'}">
                          <strong>${store.storeId}</strong>
                          <span class="status-${store.status}">● ${store.status}</span>
                          <br>
                          <small>
                            Connected: ${new Date(store.connectedAt).toLocaleString()}<br>
                            Last Activity: ${new Date(store.lastActivity).toLocaleString()}<br>
                            Errors: ${store.errorCount} | Reconnect Attempts: ${store.reconnectAttempts}
                          </small>
                        </div>
                      `
                      )
                      .join('')
              }
            </div>
            
            <p><a href="/health">Health Check (JSON)</a> | <a href="/stores">Store Details (JSON)</a></p>
          </body>
        </html>
      `)
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    }
  })

  const PORT = process.env.PORT || 3003
  healthServer.listen(PORT, () => {
    logger.info({ port: PORT }, `Server listening on port ${PORT}`)
    logger.info(`Health endpoint: http://localhost:${PORT}/health`)
    logger.info(`Store status: http://localhost:${PORT}/stores`)
    logger.info(`Dashboard: http://localhost:${PORT}/`)
  })

  const shutdown = async () => {
    logger.info('Shutting down server...')
    healthServer.close()
    workspaceReconciler?.stop()
    await workspaceOrchestrator.shutdown()

    // Flush any pending Sentry events before exiting
    logger.info('Flushing Sentry events...')
    await Sentry.flush(2000)

    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(error => {
  logger.error({ error }, 'Failed to start server')
  // Capture the error in Sentry before exiting
  Sentry.captureException(error)
  // Ensure the error is sent to Sentry before process exits
  Sentry.flush(2000).finally(() => {
    process.exit(1)
  })
})
