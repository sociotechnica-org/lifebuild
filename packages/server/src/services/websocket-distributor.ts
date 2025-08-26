import WebSocket from 'ws'

export interface WebSocketConfig {
  url: string
  authToken?: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export interface EventDistributionMessage {
  type: 'event'
  storeId: string
  event: any
  timestamp: string
}

export class WebSocketDistributor {
  private connections: Map<string, WebSocket> = new Map()
  private reconnectTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private connectionConfigs: Map<string, WebSocketConfig> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()

  async connectToStore(storeId: string, config: WebSocketConfig): Promise<void> {
    if (this.connections.has(storeId)) {
      console.warn(`⚠️ WebSocket connection already exists for store ${storeId}`)
      return
    }

    this.connectionConfigs.set(storeId, config)
    await this.createConnection(storeId, config)
  }

  private async createConnection(storeId: string, config: WebSocketConfig): Promise<void> {
    try {
      const ws = new WebSocket(config.url, {
        headers: config.authToken
          ? {
              Authorization: `Bearer ${config.authToken}`,
            }
          : undefined,
      })

      ws.on('open', () => {
        console.log(`✅ WebSocket connected for store ${storeId}`)
        this.connections.set(storeId, ws)

        // Clear any existing reconnect timeout and reset attempts
        const timeout = this.reconnectTimeouts.get(storeId)
        if (timeout) {
          clearTimeout(timeout)
          this.reconnectTimeouts.delete(storeId)
        }
        this.reconnectAttempts.delete(storeId)
      })

      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected for store ${storeId}`)
        this.connections.delete(storeId)
        this.scheduleReconnect(storeId, config)
      })

      ws.on('error', error => {
        console.error(`❌ WebSocket error for store ${storeId}:`, error)
        this.connections.delete(storeId)
        this.scheduleReconnect(storeId, config)
      })

      ws.on('message', data => {
        try {
          const message = JSON.parse(data.toString())
          this.handleIncomingMessage(storeId, message)
        } catch (error) {
          console.error(`❌ Failed to parse WebSocket message for store ${storeId}:`, error)
        }
      })
    } catch (error) {
      console.error(`❌ Failed to create WebSocket connection for store ${storeId}:`, error)
      this.scheduleReconnect(storeId, config)
    }
  }

  private scheduleReconnect(storeId: string, config: WebSocketConfig): void {
    // Clear existing timeout if any
    const existingTimeout = this.reconnectTimeouts.get(storeId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
    }

    // Check reconnect attempts
    const attempts = this.reconnectAttempts.get(storeId) || 0
    const maxAttempts = config.maxReconnectAttempts || 3

    if (attempts >= maxAttempts) {
      console.error(`❌ Store ${storeId} exceeded max reconnect attempts (${maxAttempts})`)
      this.reconnectTimeouts.delete(storeId)
      this.reconnectAttempts.delete(storeId)
      return
    }

    const interval = config.reconnectInterval || 5000
    const timeout = setTimeout(() => {
      this.reconnectTimeouts.delete(storeId)
      this.reconnectAttempts.set(storeId, attempts + 1)

      console.log(
        `🔄 Attempting to reconnect WebSocket for store ${storeId} (attempt ${attempts + 1}/${maxAttempts})`
      )

      // Handle the promise to avoid unhandled rejections
      this.createConnection(storeId, config).catch(error => {
        console.error(`❌ Reconnection failed for store ${storeId}:`, error)
        // scheduleReconnect will be called again by the error handlers in createConnection
      })
    }, interval)

    this.reconnectTimeouts.set(storeId, timeout)
  }

  private handleIncomingMessage(storeId: string, message: any): void {
    // Handle incoming messages from the sync server if needed
    console.log(`📨 Received message for store ${storeId}:`, message)
  }

  async distributeEvent(storeId: string, event: any): Promise<boolean> {
    const ws = this.connections.get(storeId)
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(`⚠️ No active WebSocket connection for store ${storeId}`)
      return false
    }

    try {
      const message: EventDistributionMessage = {
        type: 'event',
        storeId,
        event,
        timestamp: new Date().toISOString(),
      }

      ws.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error(`❌ Failed to send event to store ${storeId}:`, error)
      return false
    }
  }

  async distributeToAllStores(event: any): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()

    for (const storeId of this.connections.keys()) {
      const success = await this.distributeEvent(storeId, event)
      results.set(storeId, success)
    }

    return results
  }

  disconnectStore(storeId: string): void {
    const ws = this.connections.get(storeId)
    if (ws) {
      ws.close()
      this.connections.delete(storeId)
    }

    const timeout = this.reconnectTimeouts.get(storeId)
    if (timeout) {
      clearTimeout(timeout)
      this.reconnectTimeouts.delete(storeId)
    }

    this.connectionConfigs.delete(storeId)
    this.reconnectAttempts.delete(storeId)
    console.log(`🛑 WebSocket disconnected for store ${storeId}`)
  }

  disconnectAll(): void {
    for (const storeId of this.connections.keys()) {
      this.disconnectStore(storeId)
    }
    console.log('🛑 All WebSocket connections closed')
  }

  getConnectionStatus(): Map<
    string,
    {
      connected: boolean
      readyState?: number
      url: string
    }
  > {
    const status = new Map()

    for (const [storeId, config] of this.connectionConfigs) {
      const ws = this.connections.get(storeId)
      status.set(storeId, {
        connected: ws ? ws.readyState === WebSocket.OPEN : false,
        readyState: ws?.readyState,
        url: config.url,
      })
    }

    return status
  }
}
