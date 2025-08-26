import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { WebSocketConfig } from '../../src/services/websocket-distributor.js'

// Mock WebSocket
vi.mock('ws', () => {
  const mockWebSocketInstance = {
    on: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1, // OPEN
  }
  
  const mockWebSocket = vi.fn(() => mockWebSocketInstance)
  
  return {
    default: mockWebSocket,
    WebSocket: {
      OPEN: 1,
      CLOSED: 3,
    },
  }
})

// Import after mocking
import { WebSocketDistributor } from '../../src/services/websocket-distributor.js'
import WebSocket from 'ws'

const mockWebSocket = WebSocket as unknown as vi.MockedFunction<typeof WebSocket>

describe('WebSocketDistributor', () => {
  let distributor: WebSocketDistributor
  let eventHandlers: Map<string, Function>

  beforeEach(() => {
    vi.clearAllMocks()
    eventHandlers = new Map()
    
    mockWebSocket.mockImplementation((url, options) => {
      const instance = {
        on: vi.fn((event: string, handler: Function) => {
          eventHandlers.set(event, handler)
        }),
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1, // OPEN
      }
      return instance as any
    })

    distributor = new WebSocketDistributor()
  })

  afterEach(() => {
    distributor.disconnectAll()
  })

  describe('connectToStore', () => {
    const config: WebSocketConfig = {
      url: 'ws://localhost:8787',
      authToken: 'test-token',
      reconnectInterval: 1000,
    }

    it('should create WebSocket connection with auth headers', async () => {
      await distributor.connectToStore('test-store', config)

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:8787', {
        headers: {
          Authorization: 'Bearer test-token',
        },
      })
    })

    it('should create WebSocket connection without auth headers when no token', async () => {
      const configNoAuth: WebSocketConfig = {
        url: 'ws://localhost:8787',
      }

      await distributor.connectToStore('test-store', configNoAuth)

      expect(mockWebSocket).toHaveBeenCalledWith('ws://localhost:8787', {
        headers: undefined,
      })
    })

    it('should not create duplicate connections', async () => {
      await distributor.connectToStore('test-store', config)
      
      // Simulate successful connection
      const openHandler = eventHandlers.get('open')
      openHandler?.()

      await distributor.connectToStore('test-store', config)

      // Should only create one connection
      expect(mockWebSocket).toHaveBeenCalledTimes(1)
    })

    it('should setup event handlers', async () => {
      await distributor.connectToStore('test-store', config)

      const instance = mockWebSocket.mock.results[0].value
      expect(instance.on).toHaveBeenCalledWith('open', expect.any(Function))
      expect(instance.on).toHaveBeenCalledWith('close', expect.any(Function))
      expect(instance.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(instance.on).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })

  describe('event distribution', () => {
    const config: WebSocketConfig = {
      url: 'ws://localhost:8787',
      authToken: 'test-token',
    }

    beforeEach(async () => {
      await distributor.connectToStore('test-store', config)
      
      // Simulate successful connection
      const openHandler = eventHandlers.get('open')
      openHandler?.()
    })

    it('should distribute event to connected store', async () => {
      const event = { type: 'test.event', data: 'test data' }
      
      const result = await distributor.distributeEvent('test-store', event)

      expect(result).toBe(true)
      
      const instance = mockWebSocket.mock.results[0].value
      expect(instance.send).toHaveBeenCalledWith(JSON.stringify({
        type: 'event',
        storeId: 'test-store',
        event,
        timestamp: expect.any(String),
      }))
    })

    it('should return false when store is not connected', async () => {
      const event = { type: 'test.event', data: 'test data' }
      
      const result = await distributor.distributeEvent('non-existent-store', event)

      expect(result).toBe(false)
    })

    it('should return false when WebSocket is not open', async () => {
      const instance = mockWebSocket.mock.results[0].value
      instance.readyState = 3 // CLOSED

      const event = { type: 'test.event', data: 'test data' }
      
      const result = await distributor.distributeEvent('test-store', event)

      expect(result).toBe(false)
    })

    it('should handle send errors gracefully', async () => {
      const instance = mockWebSocket.mock.results[0].value
      instance.send.mockImplementation(() => {
        throw new Error('Send failed')
      })

      const event = { type: 'test.event', data: 'test data' }
      
      const result = await distributor.distributeEvent('test-store', event)

      expect(result).toBe(false)
    })
  })

  describe('distributeToAllStores', () => {
    beforeEach(async () => {
      const config: WebSocketConfig = {
        url: 'ws://localhost:8787',
        authToken: 'test-token',
      }

      await distributor.connectToStore('store-1', config)
      await distributor.connectToStore('store-2', config)

      // Simulate successful connections
      const openHandler = eventHandlers.get('open')
      openHandler?.()
    })

    it('should distribute event to all connected stores', async () => {
      const event = { type: 'broadcast.event', data: 'broadcast data' }
      
      const results = await distributor.distributeToAllStores(event)

      expect(results.size).toBe(2)
      expect(results.get('store-1')).toBe(true)
      expect(results.get('store-2')).toBe(true)
    })

    it('should handle mixed success/failure results', async () => {
      // Make one store fail
      const instances = mockWebSocket.mock.results
      instances[1].value.readyState = 3 // CLOSED

      const event = { type: 'broadcast.event', data: 'broadcast data' }
      
      const results = await distributor.distributeToAllStores(event)

      expect(results.size).toBe(2)
      expect(results.get('store-1')).toBe(true)
      expect(results.get('store-2')).toBe(false)
    })
  })

  describe('connection management', () => {
    const config: WebSocketConfig = {
      url: 'ws://localhost:8787',
      authToken: 'test-token',
      reconnectInterval: 100, // Short interval for testing
    }

    it('should handle connection close and attempt reconnect', async () => {
      await distributor.connectToStore('test-store', config)

      // Simulate connection close
      const closeHandler = eventHandlers.get('close')
      closeHandler?.()

      // Wait for reconnect attempt
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should have attempted to reconnect
      expect(mockWebSocket).toHaveBeenCalledTimes(2)
    })

    it('should handle connection errors and attempt reconnect', async () => {
      await distributor.connectToStore('test-store', config)

      // Simulate connection error
      const errorHandler = eventHandlers.get('error')
      errorHandler?.(new Error('Connection failed'))

      // Wait for reconnect attempt
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should have attempted to reconnect
      expect(mockWebSocket).toHaveBeenCalledTimes(2)
    })

    it('should handle incoming messages', async () => {
      await distributor.connectToStore('test-store', config)

      const messageHandler = eventHandlers.get('message')
      const mockMessage = { toString: () => JSON.stringify({ type: 'test', data: 'test' }) }
      
      expect(() => {
        messageHandler?.(mockMessage)
      }).not.toThrow()
    })

    it('should handle invalid JSON messages gracefully', async () => {
      await distributor.connectToStore('test-store', config)

      const messageHandler = eventHandlers.get('message')
      const invalidMessage = { toString: () => 'invalid json' }
      
      expect(() => {
        messageHandler?.(invalidMessage)
      }).not.toThrow()
    })
  })

  describe('disconnectStore', () => {
    const config: WebSocketConfig = {
      url: 'ws://localhost:8787',
      authToken: 'test-token',
    }

    it('should close WebSocket connection', async () => {
      await distributor.connectToStore('test-store', config)
      
      // Simulate successful connection
      const openHandler = eventHandlers.get('open')
      openHandler?.()

      distributor.disconnectStore('test-store')

      const instance = mockWebSocket.mock.results[0].value
      expect(instance.close).toHaveBeenCalled()
    })

    it('should clear reconnect timeouts', async () => {
      await distributor.connectToStore('test-store', config)

      // Simulate connection close to trigger reconnect timeout
      const closeHandler = eventHandlers.get('close')
      closeHandler?.()

      // Disconnect before reconnect happens
      distributor.disconnectStore('test-store')

      // Wait longer than reconnect interval
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should not have attempted reconnect
      expect(mockWebSocket).toHaveBeenCalledTimes(1)
    })

    it('should handle disconnecting non-existent store', () => {
      expect(() => {
        distributor.disconnectStore('non-existent')
      }).not.toThrow()
    })
  })

  describe('getConnectionStatus', () => {
    const config: WebSocketConfig = {
      url: 'ws://localhost:8787',
      authToken: 'test-token',
    }

    it('should return connection status for all stores', async () => {
      await distributor.connectToStore('test-store', config)
      
      // Simulate successful connection
      const openHandler = eventHandlers.get('open')
      openHandler?.()

      const status = distributor.getConnectionStatus()

      expect(status.has('test-store')).toBe(true)
      expect(status.get('test-store')).toEqual({
        connected: true,
        readyState: 1,
        url: 'ws://localhost:8787',
      })
    })

    it('should show disconnected status for failed connections', async () => {
      await distributor.connectToStore('test-store', config)
      // Don't simulate successful connection

      const status = distributor.getConnectionStatus()

      expect(status.get('test-store')).toEqual({
        connected: false,
        readyState: undefined,
        url: 'ws://localhost:8787',
      })
    })

    it('should return empty status when no stores', () => {
      const status = distributor.getConnectionStatus()
      expect(status.size).toBe(0)
    })
  })

  describe('disconnectAll', () => {
    it('should disconnect all stores', async () => {
      const config: WebSocketConfig = {
        url: 'ws://localhost:8787',
        authToken: 'test-token',
      }

      await distributor.connectToStore('store-1', config)
      await distributor.connectToStore('store-2', config)

      // Simulate successful connections
      const openHandler = eventHandlers.get('open')
      openHandler?.()

      distributor.disconnectAll()

      const instances = mockWebSocket.mock.results
      expect(instances[0].value.close).toHaveBeenCalled()
      expect(instances[1].value.close).toHaveBeenCalled()

      const status = distributor.getConnectionStatus()
      expect(status.size).toBe(0)
    })
  })
})