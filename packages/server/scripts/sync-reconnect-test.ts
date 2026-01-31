#!/usr/bin/env npx tsx
/**
 * Integration test for LiveStore sync disconnect detection and reconnection.
 *
 * This test:
 * 1. Starts the sync worker (Cloudflare Worker) locally
 * 2. Creates a store connection via StoreManager
 * 3. Verifies sync status is being tracked
 * 4. Kills the worker to simulate a disconnect
 * 5. Verifies the StoreManager detects the disconnect
 * 6. Restarts the worker
 * 7. Verifies the store reconnects
 *
 * Usage:
 *   pnpm --filter @lifebuild/server test:sync-reconnect
 *   # Or directly:
 *   npx tsx packages/server/scripts/sync-reconnect-test.ts
 */

import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '../../..')
const workerDir = path.resolve(rootDir, 'packages/worker')
const serverDir = path.resolve(rootDir, 'packages/server')

// Test configuration
const WORKER_PORT = 8799 // Use different port to not conflict with dev
const WORKER_STARTUP_TIMEOUT = 15000 // 15 seconds to start worker
const SYNC_STATUS_CHECK_INTERVAL = 1000 // Check every second
const DISCONNECT_DETECTION_TIMEOUT = 45000 // 45 seconds (ping 10s + timeout 10s + buffer)
const RECONNECT_TIMEOUT = 30000 // 30 seconds to reconnect

interface TestResult {
  passed: boolean
  message: string
  duration?: number
}

class SyncReconnectTest {
  private workerProcess: ChildProcess | null = null
  private storeManager: any = null
  private testStoreId = `test-${Date.now()}`

  async run(): Promise<void> {
    console.log('🧪 LiveStore Sync Disconnect Detection Integration Test\n')
    console.log(`   Test store ID: ${this.testStoreId}`)
    console.log(`   Worker port: ${WORKER_PORT}\n`)

    const results: TestResult[] = []

    try {
      // Test 1: Start the worker
      results.push(await this.testStartWorker())
      if (!results[results.length - 1].passed) {
        throw new Error('Worker failed to start')
      }

      // Test 2: Create store and verify sync status tracking
      results.push(await this.testCreateStoreAndVerifySyncStatus())
      if (!results[results.length - 1].passed) {
        throw new Error('Store creation or sync status verification failed')
      }

      // Test 3: Kill worker and verify disconnect detection
      results.push(await this.testDisconnectDetection())

      // Test 4: Restart worker and verify reconnection
      results.push(await this.testReconnection())
    } catch (error: any) {
      console.error(`\n❌ Test aborted: ${error.message}`)
    } finally {
      await this.cleanup()
    }

    // Print results
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Results\n')

    let allPassed = true
    for (const result of results) {
      const icon = result.passed ? '✅' : '❌'
      const duration = result.duration ? ` (${result.duration}ms)` : ''
      console.log(`   ${icon} ${result.message}${duration}`)
      if (!result.passed) allPassed = false
    }

    console.log('\n' + '='.repeat(60))
    if (allPassed) {
      console.log('🎉 All tests passed!')
      process.exit(0)
    } else {
      console.log('💥 Some tests failed')
      process.exit(1)
    }
  }

  private async testStartWorker(): Promise<TestResult> {
    console.log('📝 Test 1: Start sync worker')
    const startTime = Date.now()

    try {
      await this.startWorker()
      const duration = Date.now() - startTime
      console.log(`   ✅ Worker started on port ${WORKER_PORT}`)
      return { passed: true, message: 'Worker started successfully', duration }
    } catch (error: any) {
      console.log(`   ❌ Failed to start worker: ${error.message}`)
      return { passed: false, message: `Worker failed to start: ${error.message}` }
    }
  }

  private async testCreateStoreAndVerifySyncStatus(): Promise<TestResult> {
    console.log('\n📝 Test 2: Create store and verify sync status tracking')
    const startTime = Date.now()

    try {
      // Dynamically import to avoid module resolution issues
      const { StoreManager } = await import('../src/services/store-manager.js')

      // Set env for the store to connect to our test worker
      process.env.LIVESTORE_SYNC_URL = `ws://localhost:${WORKER_PORT}`
      process.env.STORE_DATA_PATH = path.join(serverDir, '.test-data')

      this.storeManager = new StoreManager(3, 2000) // 3 retries, 2s interval
      await this.storeManager.addStore(this.testStoreId)

      const storeInfo = this.storeManager.getStoreInfo(this.testStoreId)
      if (!storeInfo) {
        throw new Error('Store info not found after creation')
      }

      console.log(`   Store created with status: ${storeInfo.status}`)
      console.log(`   Sync status monitoring enabled via Sync Status API`)

      const duration = Date.now() - startTime
      return {
        passed: true,
        message: 'Store created successfully',
        duration,
      }
    } catch (error: any) {
      console.log(`   ❌ Failed: ${error.message}`)
      return { passed: false, message: `Store creation failed: ${error.message}` }
    }
  }

  private async testDisconnectDetection(): Promise<TestResult> {
    console.log('\n📝 Test 3: Kill worker, verify network disconnect detection')
    const startTime = Date.now()

    try {
      // Kill the worker
      console.log('   Killing worker process...')
      await this.stopWorker()
      console.log('   Worker killed')

      // Wait for disconnect to be detected via networkStatus
      // LiveStore uses ping/pong (default 10s interval + 10s timeout = ~20s max)
      console.log('   Waiting for network disconnect detection...')
      console.log('   (LiveStore ping/pong: 10s interval + 10s timeout)')

      const disconnectDetected = await this.waitForCondition(
        () => {
          const info = this.storeManager.getStoreInfo(this.testStoreId)
          const status = info?.status
          // Check for disconnect or error status
          return status === 'disconnected' || status === 'error' || status === 'connecting'
        },
        DISCONNECT_DETECTION_TIMEOUT,
        'disconnect to be detected',
        5000 // Log progress every 5 seconds
      )

      const duration = Date.now() - startTime
      const info = this.storeManager.getStoreInfo(this.testStoreId)

      if (disconnectDetected) {
        console.log(`   ✅ Disconnect detected! Status: ${info?.status}`)
        return {
          passed: true,
          message: `Disconnect detected (status: ${info?.status})`,
          duration,
        }
      } else {
        console.log(`   ❌ Disconnect not detected. Current status: ${info?.status}`)
        return {
          passed: false,
          message: `Disconnect not detected within ${DISCONNECT_DETECTION_TIMEOUT / 1000}s (status: ${info?.status})`,
          duration,
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      return { passed: false, message: `Disconnect detection test failed: ${error.message}` }
    }
  }

  private async testReconnection(): Promise<TestResult> {
    console.log('\n📝 Test 4: Restart worker and verify reconnection')
    const startTime = Date.now()

    try {
      // Restart the worker
      console.log('   Restarting worker...')
      await this.startWorker()
      console.log('   Worker restarted')

      // Wait for reconnection
      console.log('   Waiting for reconnection...')

      const reconnected = await this.waitForCondition(
        () => {
          const info = this.storeManager.getStoreInfo(this.testStoreId)
          return info?.status === 'connected'
        },
        RECONNECT_TIMEOUT,
        'reconnection',
        2000
      )

      const duration = Date.now() - startTime
      const info = this.storeManager.getStoreInfo(this.testStoreId)

      if (reconnected) {
        console.log(`   ✅ Reconnected! Status: ${info?.status}`)
        return { passed: true, message: 'Reconnection successful', duration }
      } else {
        console.log(`   ❌ Reconnection failed. Current status: ${info?.status}`)
        console.log(`   Reconnect attempts: ${info?.reconnectAttempts}`)
        return {
          passed: false,
          message: `Reconnection failed within ${RECONNECT_TIMEOUT / 1000}s (status: ${info?.status})`,
          duration,
        }
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      return { passed: false, message: `Reconnection test failed: ${error.message}` }
    }
  }

  private async startWorker(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Worker did not start within ${WORKER_STARTUP_TIMEOUT / 1000}s`))
      }, WORKER_STARTUP_TIMEOUT)

      this.workerProcess = spawn(
        'pnpm',
        ['wrangler', 'dev', '--port', String(WORKER_PORT), '--persist-to', '.wrangler/state/test'],
        {
          cwd: workerDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            FORCE_COLOR: '0', // Disable colors for cleaner output
          },
        }
      )

      let output = ''

      this.workerProcess.stdout?.on('data', (data: Buffer) => {
        output += data.toString()
        // Look for the "Ready on" message indicating worker is up
        if (output.includes('Ready on') || output.includes(`localhost:${WORKER_PORT}`)) {
          clearTimeout(timeout)
          resolve()
        }
      })

      this.workerProcess.stderr?.on('data', (data: Buffer) => {
        output += data.toString()
        // Wrangler sometimes outputs ready message to stderr
        if (output.includes('Ready on') || output.includes(`localhost:${WORKER_PORT}`)) {
          clearTimeout(timeout)
          resolve()
        }
      })

      this.workerProcess.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      this.workerProcess.on('exit', (code) => {
        if (code !== null && code !== 0) {
          clearTimeout(timeout)
          reject(new Error(`Worker exited with code ${code}\n${output}`))
        }
      })
    })
  }

  private async stopWorker(): Promise<void> {
    if (this.workerProcess) {
      const proc = this.workerProcess
      this.workerProcess = null

      await new Promise<void>((resolve) => {
        let resolved = false
        const cleanup = () => {
          if (!resolved) {
            resolved = true
            resolve()
          }
        }

        // Listen for exit event to know when process actually terminates
        proc.once('exit', cleanup)

        // Send SIGTERM first
        proc.kill('SIGTERM')

        // Set up SIGKILL fallback after 3 seconds if process doesn't exit
        setTimeout(() => {
          if (!resolved && proc.exitCode === null && proc.signalCode === null) {
            proc.kill('SIGKILL')
          }
        }, 3000)

        // Safety timeout - resolve after 5 seconds regardless
        setTimeout(cleanup, 5000)
      })
    }
  }

  private async waitForCondition(
    condition: () => boolean,
    timeoutMs: number,
    description: string,
    logIntervalMs?: number
  ): Promise<boolean> {
    const startTime = Date.now()
    let lastLogTime = startTime

    while (Date.now() - startTime < timeoutMs) {
      if (condition()) {
        return true
      }

      // Log progress periodically
      if (logIntervalMs && Date.now() - lastLogTime >= logIntervalMs) {
        const elapsed = Math.round((Date.now() - startTime) / 1000)
        const remaining = Math.round((timeoutMs - (Date.now() - startTime)) / 1000)
        console.log(`   ... waiting for ${description} (${elapsed}s elapsed, ${remaining}s remaining)`)
        lastLogTime = Date.now()

        // Also log current state for debugging
        if (this.storeManager) {
          const info = this.storeManager.getStoreInfo(this.testStoreId)
          console.log(`       Current status: ${info?.status}`)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, SYNC_STATUS_CHECK_INTERVAL))
    }

    return false
  }

  private async cleanup(): Promise<void> {
    console.log('\n🧹 Cleaning up...')

    if (this.storeManager) {
      try {
        await this.storeManager.shutdown()
        console.log('   Store manager shut down')
      } catch (error) {
        console.log('   Warning: Error shutting down store manager')
      }
    }

    await this.stopWorker()
    console.log('   Worker stopped')
  }
}

// Run the test
const test = new SyncReconnectTest()
test.run().catch(console.error)
