import dotenv from 'dotenv'
import { createStorePromise } from '@livestore/livestore'
import { adapter, schema } from './store.js'
import { getConversationMessages$, getConversations$ } from '@work-squared/shared/queries'

dotenv.config()

async function main() {
  console.log('🚀 Starting Work Squared server...')

  // Initialize LiveStore with proper configuration
  const storeId = process.env.STORE_ID || 'work-squared-default'
  const authToken = process.env.AUTH_TOKEN || 'insecure-token-change-me'

  console.log(`📋 Store ID: ${storeId}`)

  const store = await createStorePromise({
    adapter,
    schema: schema as any, // Version compatibility issue with types
    storeId,
    syncPayload: {
      authToken,
    },
  })

  console.log('✅ Server initialized - sync enabled')

  try {
    // Simple polling to detect new data using typed LiveStore queries
    // TODO: remove this once we have a proper event system
    const checkForChanges = async () => {
      let messageCount = 0
      const conversations = store.query(getConversations$)
      for (const conversation of conversations) {
        const messages = store.query(getConversationMessages$(conversation.id))
        messageCount += messages.length
      }
      console.log(`💬 ${messageCount} total messages`)
    }

    setInterval(checkForChanges, 5000)
  } catch (error) {
    console.log('⚠️ Event monitoring setup failed:', error)
  }

  // Add a simple HTTP health check endpoint with basic stats
  const http = await import('http')
  const healthServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

    if (req.method === 'OPTIONS') {
      res.writeHead(200)
      res.end()
      return
    }

    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(
        JSON.stringify({
          status: 'healthy',
          storeId: store.storeId,
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          storage: 'filesystem',
          dataPath: './data',
        })
      )
    } else if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      res.end(`
        <html>
          <head><title>Work Squared Server</title></head>
          <body>
            <h1>Work Squared Server</h1>
            <p>✅ Server is running</p>
            <p>Store ID: ${store.storeId}</p>
            <p>Storage: Filesystem (./data)</p>
            <p><a href="/health">Health Check</a></p>
            <p><strong>Note:</strong> LiveStore DevTools should auto-start but URL not visible in logs yet.</p>
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
    console.log(`🌐 Health endpoint: http://localhost:${PORT}/health`)
  })

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down server...')
    healthServer.close()
    await store.shutdown()
    process.exit(0)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch(console.error)
