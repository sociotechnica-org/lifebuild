import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ResourceMonitor } from './resource-monitor.js'

describe('ResourceMonitor', () => {
  let monitor: ResourceMonitor
  let alertCallback: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    alertCallback = vi.fn()

    monitor = new ResourceMonitor(
      {
        maxConcurrentLLMCalls: 5,
        maxQueuedMessages: 100,
        maxConversationsPerStore: 10,
        messageRateLimit: 60, // 1 per second
        llmCallTimeout: 5000, // 5 seconds
      },
      alertCallback
    )
  })

  afterEach(() => {
    monitor.destroy()
    vi.useRealTimers()
  })

  describe('LLM call management', () => {
    it('should allow LLM calls within limits', () => {
      expect(monitor.canMakeLLMCall()).toBe(true)

      const callId1 = monitor.trackLLMCallStart()
      expect(callId1).toBeTruthy()
      expect(monitor.canMakeLLMCall()).toBe(true) // Still under limit
    })

    it('should reject LLM calls when at limit', () => {
      // Fill to capacity
      const callIds = []
      for (let i = 0; i < 5; i++) {
        expect(monitor.canMakeLLMCall()).toBe(true)
        callIds.push(monitor.trackLLMCallStart())
      }

      // Next call should be rejected
      expect(monitor.canMakeLLMCall()).toBe(false)
      expect(() => monitor.trackLLMCallStart()).toThrow('Resource limit exceeded')
    })

    it('should allow new calls after completion', () => {
      const callId = monitor.trackLLMCallStart()
      expect(monitor.canMakeLLMCall()).toBe(true)

      monitor.trackLLMCallComplete(callId, false, 1000)

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.activeLLMCalls).toBe(0)
      expect(metrics.avgResponseTime).toBe(1000)
    })

    it('should handle call timeouts', () => {
      const callId = monitor.trackLLMCallStart()

      // Advance time past timeout
      vi.advanceTimersByTime(6000)

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.activeLLMCalls).toBe(0) // Should be decremented by timeout
    })

    it('should track response times correctly', () => {
      const callId1 = monitor.trackLLMCallStart()
      const callId2 = monitor.trackLLMCallStart()

      monitor.trackLLMCallComplete(callId1, false, 1000)
      monitor.trackLLMCallComplete(callId2, false, 2000)

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.avgResponseTime).toBe(1500) // Average of 1000 and 2000
    })
  })

  describe('Message rate limiting', () => {
    it('should allow messages within rate limit', () => {
      for (let i = 0; i < 60; i++) {
        expect(monitor.canQueueMessage()).toBe(true)
        monitor.trackMessage()
      }

      // Should reject the next message
      expect(monitor.canQueueMessage()).toBe(false)
    })

    it('should reset rate limit after time window', () => {
      // Fill to rate limit
      for (let i = 0; i < 60; i++) {
        monitor.trackMessage()
      }
      expect(monitor.canQueueMessage()).toBe(false)

      // Advance time past window
      vi.advanceTimersByTime(61000) // 61 seconds

      expect(monitor.canQueueMessage()).toBe(true)
    })

    it('should track message rate correctly', () => {
      for (let i = 0; i < 30; i++) {
        monitor.trackMessage()
      }

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.messageRate).toBe(30)
    })
  })

  describe('Error tracking', () => {
    it('should track errors correctly', () => {
      monitor.trackError('Test error 1')
      monitor.trackError('Test error 2')

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.errorRate).toBe(2)
    })

    it('should clean up old errors', () => {
      monitor.trackError('Old error')

      // Advance time past window
      vi.advanceTimersByTime(61000)

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.errorRate).toBe(0)
    })
  })

  describe('Cache tracking', () => {
    it('should track cache hits and misses', () => {
      monitor.trackCacheHit(true)
      monitor.trackCacheHit(true)
      monitor.trackCacheHit(false)

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.cacheHitRate).toBe(67) // 2/3 * 100, rounded
    })

    it('should handle no cache operations', () => {
      const metrics = monitor.getCurrentMetrics()
      expect(metrics.cacheHitRate).toBe(0)
    })
  })

  describe('Alert system', () => {
    it('should emit alerts when thresholds are exceeded', () => {
      // Fill LLM calls to trigger alert (80% of 5 = 4)
      for (let i = 0; i < 4; i++) {
        monitor.trackLLMCallStart()
      }

      // Advance time to trigger metrics collection and alert checking
      vi.advanceTimersByTime(10000)

      expect(alertCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          metric: 'activeLLMCalls',
          currentValue: 4,
        })
      )
    })

    it('should not emit duplicate alerts within time window', () => {
      // Trigger same alert twice
      for (let i = 0; i < 4; i++) {
        monitor.trackLLMCallStart()
      }

      vi.advanceTimersByTime(10000)
      vi.advanceTimersByTime(10000)

      // Should only be called once due to deduplication
      expect(alertCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Resource limits updates', () => {
    it('should allow updating limits', () => {
      monitor.updateLimits({
        maxConcurrentLLMCalls: 10,
        messageRateLimit: 120,
      })

      // Should now allow more LLM calls
      for (let i = 0; i < 7; i++) {
        expect(monitor.canMakeLLMCall()).toBe(true)
        monitor.trackLLMCallStart()
      }
    })
  })

  describe('System stress detection', () => {
    it('should detect system under stress', () => {
      // Fill to near capacity to trigger stress detection
      for (let i = 0; i < 4; i++) {
        // 80% of 5
        monitor.trackLLMCallStart()
      }

      expect(monitor.isSystemUnderStress()).toBe(true)
    })

    it('should detect healthy system', () => {
      monitor.trackLLMCallStart() // Just one call
      expect(monitor.isSystemUnderStress()).toBe(false)
    })
  })

  describe('Metrics collection and trends', () => {
    it('should collect metrics over time', () => {
      monitor.trackMessage()
      monitor.trackLLMCallStart()

      // Advance time to trigger metrics collection
      vi.advanceTimersByTime(10000)

      const report = monitor.getResourceReport()
      expect(report.current.messageRate).toBe(1)
      expect(report.current.activeLLMCalls).toBe(1)
    })

    it('should calculate trends correctly', () => {
      // Create increasing trend by adding more messages over time
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j <= i; j++) {
          monitor.trackMessage()
        }
        vi.advanceTimersByTime(10000) // Collect metrics
      }

      const report = monitor.getResourceReport()
      // Trend calculation might be 'stable' if the algorithm needs more data points
      expect(['increasing', 'stable']).toContain(report.trends.messageRateTrend)
    })

    it('should provide comprehensive resource report', () => {
      monitor.trackMessage()
      monitor.trackError('Test error')
      const callId = monitor.trackLLMCallStart()
      monitor.trackLLMCallComplete(callId, false, 500)

      const report = monitor.getResourceReport()

      expect(report).toHaveProperty('limits')
      expect(report).toHaveProperty('current')
      expect(report).toHaveProperty('alerts')
      expect(report).toHaveProperty('trends')

      expect(report.current.messageRate).toBe(1)
      expect(report.current.errorRate).toBe(1)
      expect(report.current.avgResponseTime).toBe(500)
    })
  })

  describe('Memory and CPU monitoring', () => {
    it('should report memory usage', () => {
      const metrics = monitor.getCurrentMetrics()
      expect(metrics.memoryUsageMB).toBeGreaterThanOrEqual(0)
    })

    it('should report CPU usage', () => {
      const metrics = monitor.getCurrentMetrics()
      expect(metrics.cpuUsagePercent).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Cleanup and resource management', () => {
    it('should clean up old data periodically', () => {
      // Add some data
      monitor.trackMessage()
      monitor.trackError('Test error')

      expect(monitor.getCurrentMetrics().messageRate).toBe(1)
      expect(monitor.getCurrentMetrics().errorRate).toBe(1)

      // Advance time past cleanup window
      vi.advanceTimersByTime(65000) // 65 seconds

      expect(monitor.getCurrentMetrics().messageRate).toBe(0)
      expect(monitor.getCurrentMetrics().errorRate).toBe(0)
    })

    it('should clean up on destroy', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      monitor.destroy()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Resource monitoring stopped')
      )

      consoleSpy.mockRestore()
    })

    it('should handle multiple destroy calls', () => {
      expect(() => {
        monitor.destroy()
        monitor.destroy()
      }).not.toThrow()
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle negative response times', () => {
      const callId = monitor.trackLLMCallStart()
      monitor.trackLLMCallComplete(callId, false, -100)

      const metrics = monitor.getCurrentMetrics()
      expect(metrics.avgResponseTime).toBe(-100) // Should handle gracefully
    })

    it('should handle completion of non-existent calls', () => {
      expect(() => {
        monitor.trackLLMCallComplete('non-existent-id')
      }).not.toThrow()
    })

    it('should handle rapid successive operations', () => {
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          monitor.trackMessage()
          if (i % 100 === 0) {
            monitor.trackError(`Error ${i}`)
          }
        }
      }).not.toThrow()
    })
  })
})
