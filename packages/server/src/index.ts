import dotenv from 'dotenv'
import { createStorePromise } from '@livestore/livestore'
import { adapter, schema, events, tables } from './store.js'

dotenv.config()

async function main() {
  console.log('Starting Work Squared server...')
  console.log(
    'Connecting to sync backend at:',
    process.env.LIVESTORE_SYNC_URL || 'ws://localhost:8787'
  )

  // Initialize LiveStore with proper configuration
  const store = await createStorePromise({
    adapter,
    schema: schema as any, // Temporary fix for version compatibility
    storeId: process.env.STORE_ID || 'work-squared-server',
    syncPayload: {
      authToken: process.env.AUTH_TOKEN || 'insecure-token-change-me',
    },
  })

  console.log('Store initialized successfully')

  // Test basic query first - temporarily disabled due to type issues
  // try {
  //   const allTasks = store.query(tables.tasks) as any[]
  //   console.log('Current tasks:', allTasks.length)
  // } catch (error) {
  //   console.log('Query error:', error)
  // }
  // Basic server functionality - skip events for now due to schema issues
  console.log('✅ Server initialized successfully')

  // Check data directory
  try {
    const fs = await import('fs')
    const dataPath = './data'
    if (fs.existsSync(dataPath)) {
      const files = fs.readdirSync(dataPath)
      console.log('📁 Data directory contents:', files)
    } else {
      console.log('📁 Data directory will be created on first use')
    }
  } catch (error) {
    console.log('⚠️  Could not check data directory:', error)
  }

  console.log('Store ID:', store.storeId)

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

  const PORT = 3003
  healthServer.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`)
    console.log(`🩺 Health check: http://localhost:${PORT}/health`)
    console.log(`🔧 DevTools: Check logs above for auto-generated URL`)
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
