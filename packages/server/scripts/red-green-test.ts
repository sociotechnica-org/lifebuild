/**
 * Red-Green-Refactor demonstration for Memory Management Infrastructure
 * Shows tests failing without the safety features, then passing with them enabled
 */

import { MessageQueueManager } from '../src/services/message-queue-manager.js'
import { AsyncQueueProcessor } from '../src/services/async-queue-processor.js'

// Create a "broken" version without memory management safeguards
class BrokenMessageQueueManager {
  private queues: Map<string, Array<{ id: string; content: string; timestamp: number }>> = new Map()
  
  // No size limits!
  enqueue(conversationId: string, message: { id: string; content: string }): void {
    if (!this.queues.has(conversationId)) {
      this.queues.set(conversationId, [])
    }
    const queue = this.queues.get(conversationId)!
    queue.push({ ...message, timestamp: Date.now() })
    // No overflow protection!
  }

  dequeue(conversationId: string): { id: string; content: string } | null {
    const queue = this.queues.get(conversationId)
    if (!queue || queue.length === 0) return null
    return queue.shift()! 
  }

  hasMessages(conversationId: string): boolean {
    const queue = this.queues.get(conversationId)
    return queue !== undefined && queue.length > 0
  }

  getQueueLength(conversationId: string): number {
    return this.queues.get(conversationId)?.length || 0
  }

  // No cleanup methods!
  destroy(): void {
    // No cleanup of intervals or resources
  }

  getStats(): { totalQueues: number; totalMessages: number } {
    const totalMessages = Array.from(this.queues.values()).reduce((sum, queue) => sum + queue.length, 0)
    return { totalQueues: this.queues.size, totalMessages }
  }
}

// Create a "broken" async processor without sequential guarantees
class BrokenAsyncQueueProcessor<T> {
  private tasks: Promise<T>[] = []

  // No sequential processing - just run everything in parallel!
  async enqueue<TResult extends T>(id: string, task: () => Promise<TResult>): Promise<TResult> {
    const promise = task()
    this.tasks.push(promise as Promise<T>)
    return promise
  }

  // No proper lifecycle management
  destroy(): void {
    // No cleanup
  }
}

console.log('🔴 RED: Testing WITHOUT memory management safeguards...\n')

// Test 1: Overflow Protection (should fail with broken version)
console.log('📝 Test 1: Queue Overflow Protection')
console.log('   Using BROKEN manager (no size limits)...')

const brokenManager = new BrokenMessageQueueManager()
let overflowTestPassed = false

try {
  // Fill way beyond reasonable limits
  for (let i = 0; i < 200; i++) {
    brokenManager.enqueue('overflow-test', { id: `msg-${i}`, content: `Message ${i}` })
  }
  console.log('   ❌ BROKEN VERSION: Allowed 200 messages (should have failed at 100)!')
  overflowTestPassed = false
} catch (error: any) {
  console.log('   ✅ BROKEN VERSION: Unexpectedly threw error:', error.message)
  overflowTestPassed = true
}

// Test 2: Sequential Processing (should fail with broken version)
console.log('\n📝 Test 2: Sequential Processing')
console.log('   Using BROKEN processor (parallel execution)...')

const brokenProcessor = new BrokenAsyncQueueProcessor<string>()
const brokenResults: string[] = []

const brokenPromises = []
for (let i = 0; i < 10; i++) {
  const delay = (9 - i) * 20 // Reverse delays so later tasks finish first if parallel
  const promise = brokenProcessor.enqueue(`task-${i}`, async () => {
    await new Promise(resolve => setTimeout(resolve, delay))
    const result = `result-${i}`
    brokenResults.push(result)
    return result
  })
  brokenPromises.push(promise)
}

await Promise.all(brokenPromises)

const brokenExpected = Array.from({length: 10}, (_, i) => `result-${i}`)
const brokenInOrder = JSON.stringify(brokenResults) === JSON.stringify(brokenExpected)
console.log(`   ${brokenInOrder ? '✅' : '❌'} BROKEN VERSION: Results in order: ${brokenInOrder}`)
console.log(`   Expected: [result-0, result-1, result-2, ...]`)
console.log(`   Got:      [${brokenResults.slice(0, 3).join(', ')}, ...]`)

console.log('\n' + '='.repeat(60))
console.log('🟢 GREEN: Testing WITH proper memory management safeguards...\n')

// Test 1: Overflow Protection (should pass with real version)
console.log('📝 Test 1: Queue Overflow Protection')
console.log('   Using REAL manager (with size limits)...')

const realManager = new MessageQueueManager()
let realOverflowTestPassed = false

try {
  // Fill to exactly the limit
  for (let i = 0; i < 100; i++) {
    realManager.enqueue('overflow-test', { id: `msg-${i}`, content: `Message ${i}` })
  }
  console.log('   ✅ REAL VERSION: Successfully enqueued 100 messages')
  
  // Try to exceed limit
  realManager.enqueue('overflow-test', { id: 'overflow', content: 'This should fail' })
  console.log('   ❌ REAL VERSION: Should have thrown overflow error!')
  realOverflowTestPassed = false
} catch (error: any) {
  if (error.message.includes('overflow')) {
    console.log('   ✅ REAL VERSION: Correctly rejected overflow!')
    realOverflowTestPassed = true
  } else {
    console.log('   ❌ REAL VERSION: Unexpected error:', error.message)
    realOverflowTestPassed = false
  }
}

// Test 2: Sequential Processing (should pass with real version)
console.log('\n📝 Test 2: Sequential Processing')
console.log('   Using REAL processor (sequential execution)...')

const realProcessor = new AsyncQueueProcessor<string>()
const realResults: string[] = []

const realPromises = []
for (let i = 0; i < 10; i++) {
  const delay = (9 - i) * 20 // Same reverse delays
  const promise = realProcessor.enqueue(`task-${i}`, async () => {
    await new Promise(resolve => setTimeout(resolve, delay))
    const result = `result-${i}`
    realResults.push(result)
    return result
  })
  realPromises.push(promise)
}

await Promise.all(realPromises)

const realExpected = Array.from({length: 10}, (_, i) => `result-${i}`)
const realInOrder = JSON.stringify(realResults) === JSON.stringify(realExpected)
console.log(`   ${realInOrder ? '✅' : '❌'} REAL VERSION: Results in order: ${realInOrder}`)
console.log(`   Expected: [result-0, result-1, result-2, ...]`)
console.log(`   Got:      [${realResults.slice(0, 3).join(', ')}, ...]`)

// Cleanup
brokenManager.destroy()
brokenProcessor.destroy()
realManager.destroy()
realProcessor.destroy()

console.log('\n' + '='.repeat(60))
console.log('🔄 REFACTOR: Summary of Red-Green-Refactor Results\n')

console.log(`🔴 RED (Broken Version):`)
console.log(`   - Overflow Protection: ${overflowTestPassed ? 'PASSED' : 'FAILED'} (allowed unlimited messages)`)
console.log(`   - Sequential Processing: ${brokenInOrder ? 'PASSED' : 'FAILED'} (results out of order)`)

console.log(`\n🟢 GREEN (Real Version):`)
console.log(`   - Overflow Protection: ${realOverflowTestPassed ? 'PASSED' : 'FAILED'} (properly limited at 100)`)  
console.log(`   - Sequential Processing: ${realInOrder ? 'PASSED' : 'FAILED'} (results in correct order)`)

const redGreenWorking = !overflowTestPassed && !brokenInOrder && realOverflowTestPassed && realInOrder
console.log(`\n${redGreenWorking ? '🎉' : '❌'} Red-Green-Refactor Demo: ${redGreenWorking ? 'SUCCESS' : 'FAILED'}`)

if (redGreenWorking) {
  console.log('   The memory management safeguards are working as designed!')
  console.log('   - Broken version fails as expected')  
  console.log('   - Real version passes with proper protections')
} else {
  console.log('   Something unexpected happened in the red-green comparison.')
}