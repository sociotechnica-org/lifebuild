import assert from 'node:assert'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import fs from 'node:fs'
import net from 'node:net'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..', '..', '..')

const workerPort = Number(process.env.MULTISTORE_WORKER_PORT ?? 8787)
const serverPort = Number(process.env.MULTISTORE_SERVER_PORT ?? 3003)
const startupTimeoutMs = Number(process.env.MULTISTORE_STARTUP_TIMEOUT_MS ?? 60_000)
const totalTimeoutMs = Number(process.env.MULTISTORE_TOTAL_TIMEOUT_MS ?? 90_000)

const serverBypassToken =
  process.env.MULTISTORE_SERVER_BYPASS_TOKEN ?? 'multistore-startup-test-bypass'

const storeIdA = `startup-${Math.random().toString(36).slice(2, 10)}-a`
const storeIdB = `startup-${Math.random().toString(36).slice(2, 10)}-b`

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

const waitForServerStoresConnected = async (storeIds: string[], timeoutMs: number) => {
  const missing = new Set(storeIds)
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    try {
      const health = await fetchJson<{ stores: Array<{ storeId: string; status: string }> }>(healthUrl)
      for (const store of health.stores ?? []) {
        if (store.status === 'connected') {
          missing.delete(store.storeId)
        }
      }
      if (missing.size === 0) {
        return
      }
    } catch {
      // Ignore while services are still starting up.
    }
    await delay(250)
  }

  throw new Error(`Timed out waiting for connected stores: ${Array.from(missing).join(', ')}`)
}

const spawnProcess = (
  name: string,
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
  onOutput?: (line: string) => void
): ChildProcessWithoutNullStreams => {
  const child = spawn(command, args, {
    env,
    cwd: repoRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', data => {
    const text = String(data)
    process.stdout.write(`[${name}] ${text}`)
    onOutput?.(text)
  })
  child.stderr.on('data', data => {
    const text = String(data)
    process.stderr.write(`[${name}] ${text}`)
    onOutput?.(text)
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

const run = async () => {
  console.log('Multi-store startup integration test')
  console.log(`- worker: ${syncUrl}`)
  console.log(`- server: ${healthUrl}`)
  console.log(`- stores: ${storeIdA}, ${storeIdB}`)

  const contextDir = path.join(repoRoot, '.context')
  ensureDir(contextDir)

  const dataRoot = fs.mkdtempSync(path.join(contextDir, 'multistore-startup-'))
  const serverDataPath = path.join(dataRoot, 'server')
  ensureDir(serverDataPath)

  let worker: ChildProcessWithoutNullStreams | null = null
  let server: ChildProcessWithoutNullStreams | null = null
  let cleanupStarted = false
  let serverLogs = ''

  const cleanup = async () => {
    if (cleanupStarted) return
    cleanupStarted = true
    await terminateProcess(server, 'server')
    await terminateProcess(worker, 'worker')
    fs.rmSync(dataRoot, { recursive: true, force: true })
  }

  const timeoutId = setTimeout(() => {
    console.error(`Multi-store startup integration test exceeded ${totalTimeoutMs}ms`)
    void cleanup().finally(() => process.exit(1))
  }, totalTimeoutMs)

  const workerEnv = {
    ...process.env,
    REQUIRE_AUTH: 'false',
    ENVIRONMENT: 'development',
    JWT_SECRET: process.env.JWT_SECRET ?? 'multistore-startup-test-secret',
    GRACE_PERIOD_SECONDS: '86400',
    SERVER_BYPASS_TOKEN: serverBypassToken,
    R2_PUBLIC_URL: `http://127.0.0.1:${workerPort}/api/images`,
  }

  const serverEnv = {
    ...process.env,
    NODE_ENV: 'test',
    PORT: String(serverPort),
    STORE_IDS: `${storeIdA},${storeIdB}`,
    LIVESTORE_SYNC_URL: syncUrl,
    STORE_DATA_PATH: serverDataPath,
    STORE_CONNECTION_TIMEOUT: '5000',
    STORE_RECONNECT_INTERVAL: '1000',
    STORE_MAX_RECONNECT_ATTEMPTS: '5',
    STORE_HEALTH_CHECK_INTERVAL_MS: '1000',
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
    server = spawnProcess(
      'server',
      'pnpm',
      ['--filter', '@lifebuild/server', 'dev'],
      serverEnv,
      output => {
        serverLogs += output
      }
    )
    await waitForPort(serverPort, startupTimeoutMs)
    await waitForServerStoresConnected([storeIdA, storeIdB], startupTimeoutMs)

    await delay(1_000)

    assert.ok(
      !/EADDRINUSE/i.test(serverLogs),
      'Server logs contain EADDRINUSE during multi-store startup'
    )

    console.log('\nMulti-store startup integration test completed')
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
