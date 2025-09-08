import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock all dependencies before importing the script
vi.mock('../../services/store-manager.js', () => ({
  StoreManager: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    getAllStores: vi.fn().mockReturnValue(
      new Map([
        ['test-store-1', {}],
        ['test-store-2', {}],
      ])
    ),
    updateActivity: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('../../services/task-scheduler.js', () => ({
  TaskScheduler: vi.fn().mockImplementation(() => ({
    initialize: vi.fn().mockResolvedValue(undefined),
    checkAndExecuteTasks: vi.fn().mockResolvedValue(undefined),
    getStats: vi
      .fn()
      .mockResolvedValueOnce({ processedExecutions: 0 }) // Before processing
      .mockResolvedValueOnce({ processedExecutions: 2 }), // After processing
    close: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('../../config/stores.js', () => ({
  parseStoreIds: vi.fn(),
}))

// Mock process.exit to prevent actual exit during tests
const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called')
})

// Mock console methods to reduce test noise
const mockConsole = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
}

// Mock process.on for event handler tests
vi.spyOn(process, 'on').mockImplementation(() => process)

describe('process-tasks script', () => {
  let mockParseStoreIds: any
  let mockStoreManager: any
  let mockTaskScheduler: any
  let main: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mocked functions
    const { parseStoreIds } = await import('../../config/stores.js')
    const { StoreManager } = await import('../../services/store-manager.js')
    const { TaskScheduler } = await import('../../services/task-scheduler.js')

    // Import the main function
    const processTasksModule = await import('../process-tasks.js')
    main = processTasksModule.main

    mockParseStoreIds = vi.mocked(parseStoreIds)
    mockStoreManager = vi.mocked(StoreManager)
    mockTaskScheduler = vi.mocked(TaskScheduler)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Main function', () => {
    it('should exit early when no stores are configured', async () => {
      mockParseStoreIds.mockReturnValue([])

      try {
        await main()
      } catch (error: any) {
        expect(error.message).toBe('process.exit called')
        expect(mockExit).toHaveBeenCalledWith(0)
        expect(mockConsole.log).toHaveBeenCalledWith('⚠️  No stores configured, exiting')
      }
    })

    it('should process all configured stores', async () => {
      process.env.STORE_IDS = 'test-store-1,test-store-2'
      mockParseStoreIds.mockReturnValue(['test-store-1', 'test-store-2'])

      try {
        await main()
      } catch (error: any) {
        expect(error.message).toBe('process.exit called')
        expect(mockExit).toHaveBeenCalledWith(0)
      }

      // Verify the mocked classes were called correctly
      expect(mockStoreManager).toHaveBeenCalled()
      expect(mockTaskScheduler).toHaveBeenCalled()
    })
  })

  describe('Store processing edge cases', () => {
    beforeEach(() => {
      process.env.BRAINTRUST_API_KEY = 'test-key'
      process.env.BRAINTRUST_PROJECT_ID = 'test-project'
      process.env.STORE_IDS = 'test-store-1,test-store-2'
    })

    it('should handle successful processing', async () => {
      mockParseStoreIds.mockReturnValue(['test-store-1', 'test-store-2'])

      try {
        await main()
      } catch (error: any) {
        expect(error.message).toBe('process.exit called')
        expect(mockExit).toHaveBeenCalledWith(0)
      }

      // Verify the classes were instantiated
      expect(mockStoreManager).toHaveBeenCalled()
      expect(mockTaskScheduler).toHaveBeenCalled()
    })
  })

  describe('Statistics reporting', () => {
    beforeEach(() => {
      process.env.BRAINTRUST_API_KEY = 'test-key'
      process.env.BRAINTRUST_PROJECT_ID = 'test-project'
      process.env.STORE_IDS = 'test-store-1,test-store-2'
      mockParseStoreIds.mockReturnValue(['test-store-1', 'test-store-2'])
    })

    it('should report statistics', async () => {
      try {
        await main()
      } catch (error: any) {
        expect(error.message).toBe('process.exit called')
        expect(mockExit).toHaveBeenCalledWith(0)
      }

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Task processing completed')
      )
      expect(mockConsole.log).toHaveBeenCalledWith(expect.stringContaining('Processed 2 stores'))
    })
  })

  describe('Setup functions', () => {
    it('should test that setupGracefulShutdown is exported', async () => {
      const { setupGracefulShutdown } = await import('../process-tasks.js')
      expect(setupGracefulShutdown).toBeDefined()
      expect(typeof setupGracefulShutdown).toBe('function')
    })
  })
})
