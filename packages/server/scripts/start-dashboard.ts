import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const syncHealthUrl = process.env.LIVESTORE_SYNC_HEALTH_URL || 'http://localhost:8787/'
const startTimeoutMs = Number.parseInt(process.env.SYNC_WAIT_TIMEOUT_MS || '60000', 10) || 60000

const waitForSyncServer = async () => {
  const start = Date.now()
  while (Date.now() - start < startTimeoutMs) {
    try {
      const response = await fetch(syncHealthUrl)
      if (response.ok || response.status === 404) {
        return
      }
    } catch {
      // ignore and retry
    }
    await delay(500)
  }
  throw new Error(`Timed out waiting for sync server at ${syncHealthUrl}`)
}

const main = async () => {
  await waitForSyncServer()

  const child = spawn('pnpm', ['dev'], {
    env: process.env,
    stdio: 'inherit',
  })

  child.on('exit', code => {
    process.exit(code ?? 0)
  })
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
