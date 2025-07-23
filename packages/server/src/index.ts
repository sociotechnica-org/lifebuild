import dotenv from 'dotenv'
import { createStorePromise } from '@livestore/livestore'
import { adapter, schema } from './store.js'
import { getAllTasks$, getAllProjects$, getAllUsers$ } from '@work-squared/shared/queries'

dotenv.config()

async function main() {
  console.log('🚀 Starting Work Squared server...')

  // Initialize LiveStore with proper configuration
  const store = await createStorePromise({
    adapter,
    schema: schema as any, // Version compatibility issue with types
    storeId: process.env.STORE_ID || 'work-squared-server',
    syncPayload: {
      authToken: process.env.AUTH_TOKEN || 'insecure-token-change-me',
    },
  })

  console.log('✅ Server initialized - sync enabled')

  // Monitor data using simple direct table queries
  try {
    let lastTaskCount = 0
    let lastProjectCount = 0
    let lastUserCount = 0

    // Simple polling to detect new data using typed LiveStore queries
    const checkForChanges = () => {
      try {
        // Use typed LiveStore queries from shared package
        const tasks = store.query(getAllTasks$)
        const projects = store.query(getAllProjects$)
        const users = store.query(getAllUsers$)

        if (Array.isArray(tasks) && tasks.length > lastTaskCount) {
          const newCount = tasks.length - lastTaskCount
          const latestTask = tasks[tasks.length - 1]?.title || 'Untitled'
          console.log(`📝 ${newCount} new task(s) - "${latestTask}"`)
          lastTaskCount = tasks.length
        }

        if (Array.isArray(projects) && projects.length > lastProjectCount) {
          const newCount = projects.length - lastProjectCount
          const latestProject = projects[projects.length - 1]?.name || 'Untitled'
          console.log(`📁 ${newCount} new project(s) - "${latestProject}"`)
          lastProjectCount = projects.length
        }

        if (Array.isArray(users) && users.length > lastUserCount) {
          const newCount = users.length - lastUserCount
          const latestUser = users[users.length - 1]?.name || 'Unnamed'
          console.log(`👤 ${newCount} new user(s) - "${latestUser}"`)
          lastUserCount = users.length
        }
      } catch {
        // Silently ignore query errors during startup
      }
    }

    // Check for changes every 5 seconds (less verbose)
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

  const PORT = 3003
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
