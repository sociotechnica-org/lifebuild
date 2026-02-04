import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { setTimeout as delay } from 'timers/promises'
import path from 'path'
import fs from 'fs'
import net from 'net'
import assert from 'assert'
import { fileURLToPath } from 'url'

import { createStorePromise, queryDb } from '@livestore/livestore'
import { makeAdapter } from '@livestore/adapter-node'
import { makeWsSync } from '@livestore/sync-cf/client'
import { schema, events, tables } from '@lifebuild/shared/schema'
import { DEV_AUTH } from '@lifebuild/shared/auth'

const globalWebSocket = (globalThis as { WebSocket?: unknown }).WebSocket
if (typeof globalWebSocket !== 'function') {
  const { WebSocket } = await import('ws')
  ;(globalThis as { WebSocket?: unknown }).WebSocket = WebSocket
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..', '..')

const workerPort = Number(process.env.FULLSTACK_WORKER_PORT ?? 8787)
const serverPort = Number(process.env.FULLSTACK_SERVER_PORT ?? 3003)
const startupTimeoutMs = Number(process.env.FULLSTACK_STARTUP_TIMEOUT_MS ?? 60_000)
const responseTimeoutMs = Number(process.env.FULLSTACK_RESPONSE_TIMEOUT_MS ?? 20_000)
const recoveryTimeoutMs = Number(process.env.FULLSTACK_RECOVERY_TIMEOUT_MS ?? 30_000)
const noResponseWindowMs = Number(process.env.FULLSTACK_NO_RESPONSE_WINDOW_MS ?? 2_000)
const totalTimeoutMs = Number(process.env.FULLSTACK_TOTAL_TIMEOUT_MS ?? 120_000)

const readEnvFile = (filePath: string): Record<string, string> => {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const contents = fs.readFileSync(filePath, 'utf-8')
  const env: Record<string, string> = {}

  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      continue
    }
    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }
    const key = trimmed.slice(0, separatorIndex).trim()
    let value = trimmed.slice(separatorIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key) {
      env[key] = value
    }
  }

  return env
}

const workerDevVars = readEnvFile(path.join(repoRoot, 'packages', 'worker', '.dev.vars'))
const serverBypassToken =
  process.env.FULLSTACK_SERVER_BYPASS_TOKEN ??
  workerDevVars.SERVER_BYPASS_TOKEN ??
  'fullstack-test-bypass'

const storeId = `fullstack-${Math.random().toString(36).slice(2, 10)}`
const conversationId = `conv-${Math.random().toString(36).slice(2, 10)}`

const syncUrl = `ws://127.0.0.1:${workerPort}`
const healthUrl = `http://127.0.0.1:${serverPort}/health`
const workerConfigPath = path.join(repoRoot, 'packages', 'worker', 'wrangler.jsonc')
const workerPersistPath = path.join(
  repoRoot,
  'packages',
  'worker',
  '.wrangler',
  'state',
  'sync'
)

const stubConfig = {
  defaultResponse: 'stub: {{message}}',
  responses: [
    { match: 'ping', response: 'pong' },
    { match: 'reconnect-test', response: 'reconnected' },
  ],
}

const ensureDir = (dir: string) => {
  fs.mkdirSync(dir, { recursive: true })
}

const waitForPort = async (port: number, timeoutMs: number) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const socket = net.connect(port, '127.0.0.1')
        socket.once('connect', () => {
          socket.end()
          resolve()
        })
        socket.once('error', reject)
      })
      return
    } catch {
      await delay(200)
    }
  }
  throw new Error(`Timed out waiting for port ${port}`)
}

const fetchJson = async <T>(url: string, timeoutMs = 2_000): Promise<T> => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const response = await fetch(url, { signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId)
  })
  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status} from ${url}`)
  }
  return (await response.json()) as T
}

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  return await Promise.race([
    promise,
    delay(timeoutMs).then(() => {
      throw new Error(`${label} timed out after ${timeoutMs}ms`)
    }),
  ])
}

const waitForServerStore = async (timeoutMs: number) => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const health = await fetchJson<{ stores: Array<{ storeId: string; status: string }> }>(
        healthUrl
      )
      const store = health.stores?.find(entry => entry.storeId === storeId)
      if (store?.status === 'connected') {
        return
      }
    } catch {
      // ignore until ready
    }
    await delay(300)
  }
  throw new Error(`Timed out waiting for server to report store ${storeId} connected`)
}

const waitForAssistantResponse = async (
  store: any,
  messageId: string,
  timeoutMs: number
): Promise<any> => {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const messages = store.query(
      queryDb(tables.chatMessages.select().where('conversationId', '=', conversationId))
    ) as Array<any>
    const response = messages.find(
      message => message.role === 'assistant' && message.responseToMessageId === messageId
    )
    if (response) {
      return response
    }
    await delay(200)
  }
  throw new Error(`Timed out waiting for assistant response to message ${messageId}`)
}

const spawnProcess = (
  name: string,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv
): ChildProcessWithoutNullStreams => {
  const child = spawn(command, args, {
    env,
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', data => {
    process.stdout.write(`[${name}] ${data}`)
  })
  child.stderr.on('data', data => {
    process.stderr.write(`[${name}] ${data}`)
  })

  return child
}

const waitForExit = async (child: ChildProcessWithoutNullStreams, timeoutMs: number) => {
  if (child.exitCode !== null) return
  await Promise.race([
    new Promise<void>(resolve => child.once('exit', () => resolve())),
    delay(timeoutMs).then(() => {
      throw new Error('Process did not exit in time')
    }),
  ])
}

const terminateProcess = async (child: ChildProcessWithoutNullStreams | null, name: string) => {
  if (!child || child.killed) return
  child.kill('SIGTERM')
  try {
    await waitForExit(child, 5_000)
  } catch {
    child.kill('SIGKILL')
  }
  console.log(`[${name}] stopped`)
}

const createClientStore = async (dataPath: string) => {
  const adapter = makeAdapter({
    storage: {
      type: 'fs',
      baseDirectory: dataPath,
    },
    sync: {
      backend: makeWsSync({ url: syncUrl }),
    },
  })

  return await createStorePromise({
    adapter,
    schema: schema as any,
    storeId,
    syncPayload: { instanceId: storeId, authToken: DEV_AUTH.INSECURE_TOKEN },
  })
}

const sendMessage = async (store: any, message: string) => {
  const messageId = crypto.randomUUID()
  store.commit(
    events.chatMessageSent({
      id: messageId,
      conversationId,
      message,
      role: 'user',
      createdAt: new Date(),
    })
  )
  return messageId
}

const run = async () => {
  console.log('Fullstack sync integration test')
  console.log(`- storeId: ${storeId}`)
  console.log(`- server: ${healthUrl}`)
  console.log(`- worker: ${syncUrl}`)
  console.log(
    `- timeouts (ms): startup=${startupTimeoutMs} response=${responseTimeoutMs} recovery=${recoveryTimeoutMs} total=${totalTimeoutMs}`
  )

  const contextDir = path.join(repoRoot, '.context')
  ensureDir(contextDir)
  let dataRoot: string | null = null
  let worker: ChildProcessWithoutNullStreams | null = null
  let server: ChildProcessWithoutNullStreams | null = null
  let store: any = null
  let cleanupStarted = false

  const cleanup = async () => {
    if (cleanupStarted) return
    cleanupStarted = true

    if (store) {
      await withTimeout(
        store.shutdownPromise().catch(() => undefined),
        5_000,
        'Store shutdown'
      ).catch(error => {
        console.warn('Store shutdown did not complete cleanly', error)
      })
    }

    await terminateProcess(server, 'server')
    await terminateProcess(worker, 'worker')
    if (dataRoot) {
      try {
        fs.rmSync(dataRoot, { recursive: true, force: true })
      } catch (error) {
        console.warn('Failed to remove fullstack test data directory', error)
      }
    }
  }

  const timeoutId = setTimeout(() => {
    console.error(`Fullstack integration test exceeded ${totalTimeoutMs}ms`)
    void cleanup().finally(() => process.exit(1))
  }, totalTimeoutMs)

  dataRoot = fs.mkdtempSync(path.join(contextDir, 'fullstack-'))
  const serverDataPath = path.join(dataRoot, 'server')
  const clientDataPath = path.join(dataRoot, 'client')
  ensureDir(serverDataPath)
  ensureDir(clientDataPath)

  const workerEnv = {
    ...process.env,
    REQUIRE_AUTH: 'false',
    ENVIRONMENT: 'development',
    JWT_SECRET: process.env.JWT_SECRET ?? 'fullstack-test-secret',
    GRACE_PERIOD_SECONDS: '86400',
    SERVER_BYPASS_TOKEN: serverBypassToken,
    R2_PUBLIC_URL: `http://127.0.0.1:${workerPort}/api/images`,
  }

  const serverEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(serverPort),
    STORE_IDS: storeId,
    LIVESTORE_SYNC_URL: syncUrl,
    STORE_DATA_PATH: serverDataPath,
    STORE_CONNECTION_TIMEOUT: '5000',
    STORE_RECONNECT_INTERVAL: '1000',
    STORE_MAX_RECONNECT_ATTEMPTS: '10',
    STORE_HEALTH_CHECK_INTERVAL_MS: '1000',
    LLM_PROVIDER: 'stub',
    LLM_STUB_RESPONSES: JSON.stringify(stubConfig),
    SERVER_BYPASS_TOKEN: serverBypassToken,
    AUTH_WORKER_INTERNAL_URL: '',
    AUTH_WORKER_URL: '',
  }

  const workerArgs = [
    '--filter',
    '@lifebuild/worker',
    'exec',
    'wrangler',
    'dev',
    '--config',
    workerConfigPath,
    '--port',
    String(workerPort),
    '--persist-to',
    workerPersistPath,
    '--var',
    `REQUIRE_AUTH=${workerEnv.REQUIRE_AUTH}`,
    '--var',
    `ENVIRONMENT=${workerEnv.ENVIRONMENT}`,
    '--var',
    `JWT_SECRET=${workerEnv.JWT_SECRET}`,
    '--var',
    `GRACE_PERIOD_SECONDS=${workerEnv.GRACE_PERIOD_SECONDS}`,
    '--var',
    `SERVER_BYPASS_TOKEN=${workerEnv.SERVER_BYPASS_TOKEN}`,
    '--var',
    `R2_PUBLIC_URL=${workerEnv.R2_PUBLIC_URL}`,
  ]

  try {
    console.log('\nStarting worker...')
    worker = spawnProcess('worker', 'pnpm', workerArgs, workerEnv)
    await waitForPort(workerPort, startupTimeoutMs)

    console.log('Starting server...')
    server = spawnProcess('server', 'pnpm', ['--filter', '@lifebuild/server', 'dev'], serverEnv)
    await waitForPort(serverPort, startupTimeoutMs)
    await waitForServerStore(startupTimeoutMs)

    console.log('Connecting client store...')
    store = await createClientStore(clientDataPath)

    console.log('Creating conversation...')
    store.commit(
      events.conversationCreated({
        id: conversationId,
        title: 'Fullstack Test',
        model: 'gpt-4o-mini',
        createdAt: new Date(),
      })
    )

    console.log('Sending initial message...')
    const firstMessageId = await sendMessage(store, 'ping')
    const firstResponse = await waitForAssistantResponse(
      store,
      firstMessageId,
      responseTimeoutMs
    )
    assert.equal(firstResponse.message, 'pong', 'Initial response should be stubbed pong')
    console.log('Initial response received')

    console.log('\nStopping worker to simulate disconnect...')
    await terminateProcess(worker, 'worker')
    worker = null

    console.log('Sending message while disconnected...')
    const reconnectMessageId = await sendMessage(store, 'reconnect-test')

    let unexpectedResponse = false
    try {
      await waitForAssistantResponse(store, reconnectMessageId, noResponseWindowMs)
      unexpectedResponse = true
    } catch {
      // Expected to time out before worker restarts.
    }

    assert.equal(
      unexpectedResponse,
      false,
      `Expected no response within ${noResponseWindowMs}ms while worker is down`
    )

    console.log('Restarting worker...')
    const restartStart = Date.now()
    worker = spawnProcess('worker', 'pnpm', workerArgs, workerEnv)
    await waitForPort(workerPort, startupTimeoutMs)
    const workerReadyMs = Date.now() - restartStart

    await waitForServerStore(recoveryTimeoutMs)

    const responseWaitStart = Date.now()
    const reconnectResponse = await waitForAssistantResponse(
      store,
      reconnectMessageId,
      recoveryTimeoutMs
    )
    const responseWaitMs = Date.now() - responseWaitStart

    assert.equal(reconnectResponse.message, 'reconnected', 'Reconnect response should match stub')
    assert.ok(
      responseWaitMs <= recoveryTimeoutMs,
      `Reconnect response exceeded timeout: ${responseWaitMs}ms (limit ${recoveryTimeoutMs}ms)`
    )

    console.log(
      `Worker restart ready in ${workerReadyMs}ms; reconnect response in ${responseWaitMs}ms`
    )
    console.log('\nFullstack sync integration test completed')
  } finally {
    clearTimeout(timeoutId)
    await cleanup()
  }
}

run()
  .then(() => {
    process.exit(0)
  })
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
