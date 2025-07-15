import { describe, it, expect, vi } from 'vitest'
import type { Store } from '@livestore/livestore'
import { wrapToolFunction } from '../../../src/utils/llm-tools/base.js'

describe('wrapToolFunction', () => {
  const mockStore = {
    query: vi.fn(),
    commit: vi.fn(),
    mutate: vi.fn(),
    subscribe: vi.fn(),
  } as any

  it('should return success response when function succeeds', () => {
    const mockFunction = vi.fn((_store: Store, _params: any) => ({
      success: true,
      data: 'test-result',
    }))

    const wrappedFunction = wrapToolFunction(mockFunction)
    const result = wrappedFunction(mockStore, { testParam: 'value' })

    expect(result).toEqual({
      success: true,
      data: 'test-result',
    })
    expect(mockFunction).toHaveBeenCalledWith(mockStore, { testParam: 'value' })
  })

  it('should return error response when function throws Error', () => {
    const mockFunction = vi.fn(() => {
      throw new Error('Test error message')
    })

    const wrappedFunction = wrapToolFunction(mockFunction)
    const result = wrappedFunction(mockStore, {})

    expect(result).toEqual({
      success: false,
      error: 'Test error message',
    })
  })

  it('should preserve original error messages', () => {
    const customErrors = [
      'Task ID is required',
      'Document with ID doc-123 not found',
      'Invalid assignee IDs: user-1, user-2',
    ]

    customErrors.forEach(errorMessage => {
      const mockFunction = vi.fn(() => {
        throw new Error(errorMessage)
      })

      const wrappedFunction = wrapToolFunction(mockFunction)
      const result = wrappedFunction(mockStore, {})

      expect(result.error).toBe(errorMessage)
    })
  })

  it('should handle non-Error exceptions', () => {
    const mockFunction = vi.fn(() => {
      throw 'String error'
    })

    const wrappedFunction = wrapToolFunction(mockFunction)
    const result = wrappedFunction(mockStore, {})

    expect(result).toEqual({
      success: false,
      error: 'Unknown error occurred',
    })
  })

  it('should handle null exceptions', () => {
    const mockFunction = vi.fn(() => {
      throw null
    })

    const wrappedFunction = wrapToolFunction(mockFunction)
    const result = wrappedFunction(mockStore, {})

    expect(result).toEqual({
      success: false,
      error: 'Unknown error occurred',
    })
  })

  it('should handle undefined exceptions', () => {
    const mockFunction = vi.fn(() => {
      throw undefined
    })

    const wrappedFunction = wrapToolFunction(mockFunction)
    const result = wrappedFunction(mockStore, {})

    expect(result).toEqual({
      success: false,
      error: 'Unknown error occurred',
    })
  })

  it('should pass through successful results unchanged', () => {
    const successResults = [
      { success: true, taskId: 'task-123' },
      { success: true, tasks: [] },
      { success: true, project: { id: 'proj-1' } },
    ]

    successResults.forEach(expectedResult => {
      const mockFunction = vi.fn(() => expectedResult)
      const wrappedFunction = wrapToolFunction(mockFunction)
      const result = wrappedFunction(mockStore, {})

      expect(result).toEqual(expectedResult)
    })
  })

  it('should handle functions that return non-success responses', () => {
    const mockFunction = vi.fn(() => ({
      success: false,
      error: 'Business logic error',
    }))

    const wrappedFunction = wrapToolFunction(mockFunction)
    const result = wrappedFunction(mockStore, {})

    expect(result).toEqual({
      success: false,
      error: 'Business logic error',
    })
  })
})
