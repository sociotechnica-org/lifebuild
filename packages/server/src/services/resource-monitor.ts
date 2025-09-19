import { logger } from '../utils/logger.js'

interface ResourceLimits {
  maxConcurrentLLMCalls: number
  maxQueuedMessages: number
  maxConversationsPerStore: number
  maxMemoryUsageMB: number
  maxCPUUsagePercent: number
  messageRateLimit: number // messages per minute
  llmCallTimeout: number // milliseconds
}

interface ResourceMetrics {
  timestamp: number
  activeLLMCalls: number
  queuedMessages: number
  activeConversations: number
  memoryUsageMB: number
  cpuUsagePercent: number
  messageRate: number // messages per minute
  errorRate: number // errors per minute
  avgResponseTime: number // milliseconds
  cacheHitRate: number // percentage
}

interface ResourceAlert {
  type: 'warning' | 'critical'
  metric: keyof ResourceMetrics
  currentValue: number
  threshold: number
  message: string
  timestamp: number
}

export class ResourceMonitor {
  private static readonly DEFAULT_LIMITS: ResourceLimits = {
    maxConcurrentLLMCalls: 10,
    maxQueuedMessages: 1000,
    maxConversationsPerStore: 100,
    maxMemoryUsageMB: 512,
    maxCPUUsagePercent: 80,
    messageRateLimit: 600, // 10 messages per second
    llmCallTimeout: 30000, // 30 seconds
  }

  private limits: ResourceLimits
  private metrics: ResourceMetrics[] = []
  private alerts: ResourceAlert[] = []
  private activeLLMCalls = 0
  private messageCount = 0
  private errorCount = 0
  private responseTimes: number[] = []
  private cacheStats = { hits: 0, misses: 0 }

  private metricsInterval?: NodeJS.Timeout
  private cleanupInterval?: NodeJS.Timeout

  // Track LLM call timeouts to prevent false positives
  private llmCallTimeouts: Map<string, NodeJS.Timeout> = new Map()

  // Sliding window for rate calculations
  private readonly windowSize = 60000 // 1 minute
  private messageTimestamps: number[] = []
  private errorTimestamps: number[] = []

  constructor(
    customLimits?: Partial<ResourceLimits>,
    private onAlert?: (alert: ResourceAlert) => void
  ) {
    this.limits = { ...ResourceMonitor.DEFAULT_LIMITS, ...customLimits }
    this.startMonitoring()
  }

  /**
   * Check if a new LLM call can be made
   */
  canMakeLLMCall(): boolean {
    if (this.activeLLMCalls >= this.limits.maxConcurrentLLMCalls) {
      this.emitAlert(
        'critical',
        'activeLLMCalls',
        this.activeLLMCalls,
        this.limits.maxConcurrentLLMCalls,
        'Maximum concurrent LLM calls reached'
      )
      return false
    }
    return true
  }

  /**
   * Track LLM call start
   */
  trackLLMCallStart(): string {
    if (!this.canMakeLLMCall()) {
      throw new Error('LLM call rejected: Resource limit exceeded')
    }

    this.activeLLMCalls++
    const callId = crypto.randomUUID()

    // Set timeout for the call
    const timeoutHandle = setTimeout(() => {
      console.warn(`🚨 Resource Monitor: LLM call timeout for ${callId}`)
      this.llmCallTimeouts.delete(callId) // Clean up the timeout reference
      this.trackLLMCallComplete(callId, true) // Mark as timeout
    }, this.limits.llmCallTimeout)

    // Store timeout handle so we can clear it if the call completes successfully
    this.llmCallTimeouts.set(callId, timeoutHandle)

    return callId
  }

  /**
   * Track LLM call completion
   */
  trackLLMCallComplete(callId: string, isTimeout: boolean = false, responseTime?: number): void {
    if (this.activeLLMCalls > 0) {
      this.activeLLMCalls--
    }

    // Clear the timeout if this is a successful completion
    if (!isTimeout) {
      const timeoutHandle = this.llmCallTimeouts.get(callId)
      if (timeoutHandle) {
        clearTimeout(timeoutHandle)
        this.llmCallTimeouts.delete(callId)
      }
    }

    if (isTimeout) {
      this.trackError('LLM call timeout')
    } else if (responseTime) {
      this.responseTimes.push(responseTime)

      // Keep only recent response times for average calculation
      if (this.responseTimes.length > 100) {
        this.responseTimes = this.responseTimes.slice(-50)
      }
    }
  }

  /**
   * Check if a new message can be queued
   */
  canQueueMessage(): boolean {
    const totalQueued = this.getCurrentQueuedMessages()
    if (totalQueued >= this.limits.maxQueuedMessages) {
      this.emitAlert(
        'critical',
        'queuedMessages',
        totalQueued,
        this.limits.maxQueuedMessages,
        'Maximum queued messages limit reached'
      )
      return false
    }

    // Check message rate limit
    const currentRate = this.getMessageRate()
    if (currentRate > this.limits.messageRateLimit) {
      this.emitAlert(
        'warning',
        'messageRate',
        currentRate,
        this.limits.messageRateLimit,
        'Message rate limit exceeded'
      )
      return false
    }

    return true
  }

  /**
   * Track new message
   */
  trackMessage(): void {
    this.messageCount++
    this.messageTimestamps.push(Date.now())

    // Clean old timestamps outside the window
    const cutoff = Date.now() - this.windowSize
    this.messageTimestamps = this.messageTimestamps.filter(ts => ts > cutoff)
  }

  /**
   * Track error occurrence
   */
  trackError(errorType: string): void {
    this.errorCount++
    this.errorTimestamps.push(Date.now())

    // Clean old error timestamps
    const cutoff = Date.now() - this.windowSize
    this.errorTimestamps = this.errorTimestamps.filter(ts => ts > cutoff)

    console.warn(`🚨 Resource Monitor: ${errorType}`)
  }

  /**
   * Track cache hit/miss
   */
  trackCacheHit(isHit: boolean): void {
    if (isHit) {
      this.cacheStats.hits++
    } else {
      this.cacheStats.misses++
    }
  }

  /**
   * Get current resource metrics
   */
  getCurrentMetrics(): ResourceMetrics {
    const now = Date.now()

    return {
      timestamp: now,
      activeLLMCalls: this.activeLLMCalls,
      queuedMessages: this.getCurrentQueuedMessages(),
      activeConversations: this.getCurrentActiveConversations(),
      memoryUsageMB: this.getMemoryUsage(),
      cpuUsagePercent: this.getCPUUsage(),
      messageRate: this.getMessageRate(),
      errorRate: this.getErrorRate(),
      avgResponseTime: this.getAverageResponseTime(),
      cacheHitRate: this.getCacheHitRate(),
    }
  }

  /**
   * Get resource usage report
   */
  getResourceReport(): {
    limits: ResourceLimits
    current: ResourceMetrics
    alerts: ResourceAlert[]
    trends: {
      messageRateTrend: 'increasing' | 'stable' | 'decreasing'
      errorRateTrend: 'increasing' | 'stable' | 'decreasing'
      responseTimeTrend: 'increasing' | 'stable' | 'decreasing'
    }
  } {
    const current = this.getCurrentMetrics()
    const trends = this.calculateTrends()

    return {
      limits: this.limits,
      current,
      alerts: this.getRecentAlerts(),
      trends,
    }
  }

  /**
   * Check if system is under stress
   */
  isSystemUnderStress(): boolean {
    const metrics = this.getCurrentMetrics()

    return (
      metrics.activeLLMCalls > this.limits.maxConcurrentLLMCalls * 0.8 ||
      metrics.queuedMessages > this.limits.maxQueuedMessages * 0.8 ||
      metrics.memoryUsageMB > this.limits.maxMemoryUsageMB * 0.9 ||
      metrics.cpuUsagePercent > this.limits.maxCPUUsagePercent * 0.9 ||
      metrics.errorRate > 10 // More than 10 errors per minute
    )
  }

  /**
   * Update resource limits
   */
  updateLimits(newLimits: Partial<ResourceLimits>): void {
    this.limits = { ...this.limits, ...newLimits }
    console.log('📊 Resource limits updated:', newLimits)
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // Collect metrics every 10 seconds
    this.metricsInterval = setInterval(() => {
      const metrics = this.getCurrentMetrics()
      this.metrics.push(metrics)

      // Keep only recent metrics (last hour)
      if (this.metrics.length > 360) {
        // 6 per minute * 60 minutes
        this.metrics = this.metrics.slice(-300)
      }

      this.checkAlerts(metrics)
    }, 10000)

    // Cleanup old data every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData()
    }, 60000)

    logger.debug('Resource monitoring started')
  }

  /**
   * Check for alerts based on current metrics
   */
  private checkAlerts(metrics: ResourceMetrics): void {
    const checks: Array<{
      metric: keyof ResourceMetrics
      value: number
      threshold: number
      type: 'warning' | 'critical'
    }> = [
      {
        metric: 'activeLLMCalls',
        value: metrics.activeLLMCalls,
        threshold: this.limits.maxConcurrentLLMCalls * 0.8,
        type: 'warning',
      },
      {
        metric: 'queuedMessages',
        value: metrics.queuedMessages,
        threshold: this.limits.maxQueuedMessages * 0.8,
        type: 'warning',
      },
      {
        metric: 'memoryUsageMB',
        value: metrics.memoryUsageMB,
        threshold: this.limits.maxMemoryUsageMB * 0.9,
        type: 'critical',
      },
      {
        metric: 'cpuUsagePercent',
        value: metrics.cpuUsagePercent,
        threshold: this.limits.maxCPUUsagePercent * 0.9,
        type: 'critical',
      },
      {
        metric: 'errorRate',
        value: metrics.errorRate,
        threshold: 10,
        type: 'warning',
      },
    ]

    checks.forEach(check => {
      if (check.value > check.threshold) {
        this.emitAlert(
          check.type,
          check.metric,
          check.value,
          check.threshold,
          `${check.metric} is ${check.type === 'critical' ? 'critically' : 'dangerously'} high`
        )
      }
    })
  }

  /**
   * Emit an alert
   */
  private emitAlert(
    type: 'warning' | 'critical',
    metric: keyof ResourceMetrics,
    currentValue: number,
    threshold: number,
    message: string
  ): void {
    const alert: ResourceAlert = {
      type,
      metric,
      currentValue,
      threshold,
      message,
      timestamp: Date.now(),
    }

    // Avoid duplicate alerts within 1 minute
    const recentSimilarAlert =
      this.alerts.filter(a => a.metric === metric && Date.now() - a.timestamp < 60000).length > 0

    if (!recentSimilarAlert) {
      this.alerts.push(alert)
      console.warn(
        `${type === 'critical' ? '🚨' : '⚠️'} ${message}: ${currentValue} (threshold: ${threshold})`
      )

      if (this.onAlert) {
        this.onAlert(alert)
      }
    }
  }

  /**
   * Calculate trends from recent metrics
   */
  private calculateTrends(): {
    messageRateTrend: 'increasing' | 'stable' | 'decreasing'
    errorRateTrend: 'increasing' | 'stable' | 'decreasing'
    responseTimeTrend: 'increasing' | 'stable' | 'decreasing'
  } {
    const recentMetrics = this.metrics.slice(-6) // Last 6 data points (1 minute)

    if (recentMetrics.length < 3) {
      return {
        messageRateTrend: 'stable',
        errorRateTrend: 'stable',
        responseTimeTrend: 'stable',
      }
    }

    const calculateTrend = (values: number[]): 'increasing' | 'stable' | 'decreasing' => {
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

      const change = (secondAvg - firstAvg) / firstAvg

      if (change > 0.1) return 'increasing'
      if (change < -0.1) return 'decreasing'
      return 'stable'
    }

    return {
      messageRateTrend: calculateTrend(recentMetrics.map(m => m.messageRate)),
      errorRateTrend: calculateTrend(recentMetrics.map(m => m.errorRate)),
      responseTimeTrend: calculateTrend(recentMetrics.map(m => m.avgResponseTime)),
    }
  }

  /**
   * Get recent alerts (last hour)
   */
  private getRecentAlerts(): ResourceAlert[] {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    return this.alerts.filter(alert => alert.timestamp > oneHourAgo)
  }

  /**
   * Helper methods for metrics calculation
   */
  private getCurrentQueuedMessages(): number {
    // This would be implemented to get actual queued message count
    // For now, return 0 as placeholder
    return 0
  }

  private getCurrentActiveConversations(): number {
    // This would be implemented to get actual active conversation count
    return 0
  }

  private getMemoryUsage(): number {
    try {
      const usage = process.memoryUsage()
      return Math.round(usage.heapUsed / 1024 / 1024) // Convert to MB
    } catch {
      return 0
    }
  }

  private getCPUUsage(): number {
    try {
      const usage = process.cpuUsage()
      // Simplified CPU usage calculation
      return Math.round((usage.user + usage.system) / 1000000) // Convert to percentage approximation
    } catch {
      return 0
    }
  }

  private getMessageRate(): number {
    return this.messageTimestamps.length // Messages in the last minute
  }

  private getErrorRate(): number {
    return this.errorTimestamps.length // Errors in the last minute
  }

  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0
    return Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length)
  }

  private getCacheHitRate(): number {
    const total = this.cacheStats.hits + this.cacheStats.misses
    if (total === 0) return 0
    return Math.round((this.cacheStats.hits / total) * 100)
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000

    // Clean old alerts
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneHourAgo)

    // Clean old timestamps
    this.messageTimestamps = this.messageTimestamps.filter(ts => ts > Date.now() - this.windowSize)
    this.errorTimestamps = this.errorTimestamps.filter(ts => ts > Date.now() - this.windowSize)
  }

  /**
   * Stop monitoring and clean up
   */
  destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = undefined
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }

    // Clear all pending LLM call timeouts
    for (const timeoutHandle of this.llmCallTimeouts.values()) {
      clearTimeout(timeoutHandle)
    }
    this.llmCallTimeouts.clear()

    logger.debug('Resource monitoring stopped')
  }
}
