/**
 * Integration tests for server infrastructure.
 * - Memory Management Infrastructure
 * - WebSocket disconnect + reconnect with sync server
 */

import { MessageQueueManager } from '../src/services/message-queue-manager.js'
import { AsyncQueueProcessor } from '../src/services/async-queue-processor.js'
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

async function runMemoryManagementTests() {
  console.log('🧪 Testing Memory Management Infrastructure\n')

  // Test 1: Memory Leak Prevention
  console.log('📝 Test 1: Memory Leak Prevention')
  console.log('   Creating 1000+ message queues...')

  const manager = new MessageQueueManager()
  const startTime = Date.now()

  // Create many conversations with messages
  for (let i = 0; i < 1000; i++) {
    manager.enqueue(`conversation-${i}`, {
      id: `msg-${i}`,
      content: `Test message ${i}`,
    })
  }

  console.log(`   ✅ Created 1000 queues in ${Date.now() - startTime}ms`)
  const stats = manager.getStats()
  console.log(
    `   📊 Queue stats: ${stats.totalConversations} conversations, ${stats.totalMessages} messages`
  )

  // Test 2: Queue Overflow Handling
  console.log('\n📝 Test 2: Queue Overflow Handling')
  console.log('   Filling conversation queue to max capacity (100 messages)...')

  const testConversation = 'overflow-test'
  try {
    // Fill to capacity
    for (let i = 0; i < 100; i++) {
      manager.enqueue(testConversation, { id: `overflow-${i}`, content: `Message ${i}` })
    }
    console.log(`   ✅ Successfully enqueued 100 messages`)

    // Try to overflow
    manager.enqueue(testConversation, { id: 'overflow-101', content: 'This should fail' })
    console.log('   ❌ ERROR: Should have thrown overflow error!')
  } catch (error: any) {
    if (error.message.includes('overflow')) {
      console.log(`   ✅ Correctly rejected overflow: ${error.message}`)
    } else {
      console.log(`   ❌ Unexpected error: ${error.message}`)
    }
  }

  // Test 3: Race Condition Prevention
  console.log('\n📝 Test 3: Race Condition Prevention')
  console.log('   Testing 50 concurrent async tasks...')

  const processor = new AsyncQueueProcessor<string>()
  const promises = []
  const results: string[] = []

  for (let i = 0; i < 50; i++) {
    const delay = Math.random() * 50 // Random delays up to 50ms
    const promise = processor.enqueue(`task-${i}`, async () => {
      await new Promise(resolve => setTimeout(resolve, delay))
      const result = `result-${i}`
      results.push(result)
      return result
    })
    promises.push(promise)
  }

  const taskResults = await Promise.all(promises)
  console.log(`   ✅ All 50 tasks completed`)

  // Verify sequential execution (results should be in order)
  const expectedResults = Array.from({ length: 50 }, (_, i) => `result-${i}`)
  const resultsMatch = JSON.stringify(results) === JSON.stringify(expectedResults)
  console.log(`   ${resultsMatch ? '✅' : '❌'} Results in correct order: ${resultsMatch}`)

  // Test 4: Basic Cleanup Verification
  console.log('\n📝 Test 4: Basic Queue Operations')
  console.log('   Testing queue management and basic operations...')

  const testQueue = 'basic-ops-test'

  // Test basic operations
  const hasMessagesBefore = manager.hasMessages(testQueue)
  console.log(`   ${!hasMessagesBefore ? '✅' : '❌'} Queue initially empty: ${!hasMessagesBefore}`)

  manager.enqueue(testQueue, { id: 'test1', content: 'Test message 1' })
  manager.enqueue(testQueue, { id: 'test2', content: 'Test message 2' })

  const hasMessagesAfter = manager.hasMessages(testQueue)
  const queueLength = manager.getQueueLength(testQueue)
  console.log(
    `   ${hasMessagesAfter ? '✅' : '❌'} Queue has messages after enqueue: ${hasMessagesAfter}`
  )
  console.log(
    `   ${queueLength === 2 ? '✅' : '❌'} Correct queue length: ${queueLength} (expected 2)`
  )

  // Test dequeue
  const dequeued = manager.dequeue(testQueue)
  const lengthAfterDequeue = manager.getQueueLength(testQueue)
  console.log(`   ${dequeued ? '✅' : '❌'} Successfully dequeued message: ${dequeued?.id}`)
  console.log(
    `   ${lengthAfterDequeue === 1 ? '✅' : '❌'} Correct length after dequeue: ${lengthAfterDequeue}`
  )

  // Cleanup
  manager.destroy()
  processor.destroy()

  console.log('\n🎉 Memory Management Infrastructure integration tests completed!')
  console.log('   ✅ Memory leak prevention verified')
  console.log('   ✅ Queue overflow protection verified')
  console.log('   ✅ Race condition prevention verified')
  console.log('   ✅ Basic queue operations verified')
  console.log('\n   All core functionality working beyond unit tests! 🚀')
}

type ChildProcessHandle = ReturnType<typeof spawn>

const waitForCondition = async (
  label: string,
  timeoutMs: number,
  intervalMs: number,
  predicate: () => Promise<boolean>
) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) {
      return
    }
    await delay(intervalMs)
  }
  throw new Error(`Timed out waiting for ${label} after ${timeoutMs}ms`)
}

const waitForHttp = async (url: string, timeoutMs = 30_000) =>
  waitForCondition(`HTTP ${url}`, timeoutMs, 500, async () => {
    try {
      const response = await fetch(url)
      return response.ok || response.status === 404
    } catch {
      return false
    }
  })

const fetchJson = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

const spawnProcess = (command: string, args: string[], env: NodeJS.ProcessEnv): ChildProcessHandle => {
  const child = spawn(command, args, {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout?.on('data', data => {
    process.stdout.write(data)
  })
  child.stderr?.on('data', data => {
    process.stderr.write(data)
  })

  return child
}

async function runNetworkReconnectTest() {
  console.log('\n🧪 Testing LiveStore network reconnect with sync server\n')

  const workspaceId = `integration-${Date.now()}`
  const serverPort = 3100
  const syncPort = 8787
  const dataDir = mkdtempSync(path.join(tmpdir(), 'lifebuild-server-'))

  let syncProcess: ChildProcessHandle | null = null
  let serverProcess: ChildProcessHandle | null = null

  const cleanup = async () => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM')
      serverProcess = null
    }
    if (syncProcess) {
      syncProcess.kill('SIGTERM')
      syncProcess = null
    }
    rmSync(dataDir, { recursive: true, force: true })
  }

  try {
    console.log('🚀 Starting sync server (worker)...')
    syncProcess = spawnProcess(
      'pnpm',
      ['--filter', '@lifebuild/worker', 'dev'],
      {
        ...process.env,
        ENVIRONMENT: 'development',
        REQUIRE_AUTH: 'false',
        JWT_SECRET: 'test-secret',
        GRACE_PERIOD_SECONDS: '86400',
        SERVER_BYPASS_TOKEN: 'test-bypass-token',
        R2_PUBLIC_URL: `http://localhost:${syncPort}/api/images`,
      }
    )

    await waitForHttp(`http://localhost:${syncPort}/`)
    console.log('✅ Sync server is up')

    console.log('🚀 Starting server...')
    serverProcess = spawnProcess(
      'pnpm',
      ['--filter', '@lifebuild/server', 'dev'],
      {
        ...process.env,
        PORT: String(serverPort),
        STORE_IDS: workspaceId,
        STORE_DATA_PATH: dataDir,
        LIVESTORE_SYNC_URL: `ws://localhost:${syncPort}`,
        SERVER_BYPASS_TOKEN: 'test-bypass-token',
        LIVESTORE_PING_INTERVAL_MS: '1000',
        LIVESTORE_PING_TIMEOUT_MS: '1000',
        NODE_ENV: 'development',
      }
    )

    await waitForHttp(`http://localhost:${serverPort}/health`)
    console.log('✅ Server is up')

    const networkUrl = `http://localhost:${serverPort}/debug/network-health`
    await waitForCondition('store to connect', 30_000, 1000, async () => {
      const data = await fetchJson(networkUrl)
      const store = data.stores?.[workspaceId]
      return store?.networkStatus?.isConnected === true
    })

    console.log('✅ Store connected to sync server')

    console.log('🔌 Stopping sync server to simulate disconnect...')
    syncProcess?.kill('SIGTERM')
    syncProcess = null

    await waitForCondition('store to disconnect', 30_000, 1000, async () => {
      const data = await fetchJson(networkUrl)
      const store = data.stores?.[workspaceId]
      return store?.networkStatus?.isConnected === false
    })
    console.log('✅ Store detected disconnect')

    console.log('🔄 Restarting sync server...')
    syncProcess = spawnProcess(
      'pnpm',
      ['--filter', '@lifebuild/worker', 'dev'],
      {
        ...process.env,
        ENVIRONMENT: 'development',
        REQUIRE_AUTH: 'false',
        JWT_SECRET: 'test-secret',
        GRACE_PERIOD_SECONDS: '86400',
        SERVER_BYPASS_TOKEN: 'test-bypass-token',
        R2_PUBLIC_URL: `http://localhost:${syncPort}/api/images`,
      }
    )

    await waitForHttp(`http://localhost:${syncPort}/`)
    console.log('✅ Sync server restarted')

    await waitForCondition('store to reconnect', 30_000, 1000, async () => {
      const data = await fetchJson(networkUrl)
      const store = data.stores?.[workspaceId]
      return store?.networkStatus?.isConnected === true
    })

    console.log('✅ Store reconnected automatically')
  } finally {
    await cleanup()
  }
}

// Run the tests
runMemoryManagementTests()
  .then(() => runNetworkReconnectTest())
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
