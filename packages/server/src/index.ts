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

import { storeManager } from './services/store-manager.js'
import { EventProcessor } from './services/event-processor.js'
import { loadStoresConfig } from './config/stores.js'
import { logger } from './utils/logger.js'

async function main() {
  logger.info('Starting Work Squared Multi-Store Server...')

  const config = loadStoresConfig()

  await storeManager.initialize(config.storeIds)

  if (config.storeIds.length === 0) {
    logger.warn('No stores configured. Server running in monitoring mode only.')
  }

  // Set up event processor
  const eventProcessor = new EventProcessor(storeManager)

  // Start monitoring all stores
  for (const [storeId, store] of storeManager.getAllStores()) {
    await eventProcessor.startMonitoring(storeId, store)
  }

  logger.info('Event monitoring started for all stores')

  const http = await import('http')
  const healthServer = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (req.url === '/health') {
      const healthStatus = storeManager.getHealthStatus()
      const processingStats = eventProcessor.getProcessingStats()
      const liveStoreStats = await eventProcessor.getLiveStoreStats()
      const globalResourceStatus = eventProcessor.getGlobalResourceStatus({
        pendingUserMessages: liveStoreStats.totals.pendingUserMessages,
        userMessages: liveStoreStats.totals.userMessages,
      })
      const processedStats = await eventProcessor.getProcessedMessageStats()

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
        })
      )
    } else if (req.url === '/stores') {
      const storeInfo = storeManager.getAllStoreInfo()
      const processingStats = eventProcessor.getProcessingStats()
      const stores = Array.from(storeInfo.entries()).map(([id, info]) => ({
        id,
        status: info.status,
        connectedAt: info.connectedAt.toISOString(),
        lastActivity: info.lastActivity.toISOString(),
        errorCount: info.errorCount,
        reconnectAttempts: info.reconnectAttempts,
        processing: processingStats.get(id) || null,
      }))

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ stores }))
    } else if (req.url === '/') {
      const healthStatus = storeManager.getHealthStatus()

      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`
        <html>
          <head>
            <title>Work Squared Multi-Store Server</title>
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
            <h1>Work Squared Multi-Store Server</h1>
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
    eventProcessor.stopAll()
    await storeManager.shutdown()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(error => {
  logger.error({ error }, 'Failed to start server')
  process.exit(1)
})
