import { renderHook } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useSearch } from '../../src/hooks/useSearch.js'

describe('useSearch', () => {
  const mockItems = [
    { id: '1', title: 'First Document', content: 'This is the first document' },
    { id: '2', title: 'Second Document', content: 'This is the second document' },
    { id: '3', title: 'Third Document', content: 'This contains different content' },
  ]

  it('should return all items when query is empty', () => {
    const { result } = renderHook(() =>
      useSearch(mockItems, '', { searchFields: ['title', 'content'] })
    )

    expect(result.current).toEqual(mockItems)
  })

  it('should filter items based on title', () => {
    const { result } = renderHook(() =>
      useSearch(mockItems, 'First', { searchFields: ['title', 'content'] })
    )

    expect(result.current).toEqual([mockItems[0]])
  })

  it('should filter items based on content', () => {
    const { result } = renderHook(() =>
      useSearch(mockItems, 'different', { searchFields: ['title', 'content'] })
    )

    expect(result.current).toEqual([mockItems[2]])
  })

  it('should be case insensitive', () => {
    const { result } = renderHook(() =>
      useSearch(mockItems, 'FIRST', { searchFields: ['title', 'content'] })
    )

    expect(result.current).toEqual([mockItems[0]])
  })

  it('should return multiple matches', () => {
    const { result } = renderHook(() =>
      useSearch(mockItems, 'Document', { searchFields: ['title', 'content'] })
    )

    expect(result.current).toEqual(mockItems)
  })

  it('should apply custom filter function', () => {
    const { result } = renderHook(() =>
      useSearch(mockItems, '', {
        searchFields: ['title', 'content'],
        filterFn: item => item.id !== '2',
      })
    )

    expect(result.current).toEqual([mockItems[0], mockItems[2]])
  })

  it('should combine search query and filter function', () => {
    const { result } = renderHook(() =>
      useSearch(mockItems, 'Document', {
        searchFields: ['title', 'content'],
        filterFn: item => item.id !== '2',
      })
    )

    expect(result.current).toEqual([mockItems[0], mockItems[2]])
  })

  it('should handle readonly arrays', () => {
    const readonlyItems: ReadonlyArray<(typeof mockItems)[0]> = mockItems
    const { result } = renderHook(() =>
      useSearch(readonlyItems, 'First', { searchFields: ['title', 'content'] })
    )

    expect(result.current).toEqual([mockItems[0]])
  })
})
