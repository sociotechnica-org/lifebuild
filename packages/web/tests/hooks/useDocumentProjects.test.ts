import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import {
  useDocumentProjects,
  useDocumentProjectsTargeted,
} from '../../src/hooks/useDocumentProjects.js'
import { getAllDocumentProjects$, getProjects$ } from '@work-squared/shared/queries'
import { useQuery } from '@livestore/react'

// Hoisted mocks
const { mockDocumentProjects, mockProjects } = vi.hoisted(() => {
  const mockDocumentProjects = [
    { documentId: 'doc1', projectId: 'proj1' },
    { documentId: 'doc1', projectId: 'proj2' },
    { documentId: 'doc2', projectId: 'proj1' },
  ]
  const mockProjects = [
    { id: 'proj1', name: 'Project 1', description: 'First project' },
    { id: 'proj2', name: 'Project 2', description: 'Second project' },
    { id: 'proj3', name: 'Project 3', description: 'Third project' },
  ]
  return { mockDocumentProjects, mockProjects }
})

// Mock queries first
vi.mock('@work-squared/shared/queries', () => ({
  getAllDocumentProjects$: vi.fn(),
  getDocumentProjectsByDocument$: vi.fn(),
  getProjects$: vi.fn(),
}))

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(),
}))

describe('useDocumentProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock implementation
    vi.mocked(useQuery).mockImplementation((query: any) => {
      if (query === getAllDocumentProjects$) {
        return mockDocumentProjects
      }
      if (query === getProjects$) {
        return mockProjects
      }
      return []
    })
  })

  it('returns projects associated with a document', () => {
    const { result } = renderHook(() => useDocumentProjects('doc1'))

    expect(result.current).toEqual([
      { id: 'proj1', name: 'Project 1', description: 'First project' },
      { id: 'proj2', name: 'Project 2', description: 'Second project' },
    ])
  })

  it('returns empty array when document has no projects', () => {
    const { result } = renderHook(() => useDocumentProjects('doc3'))

    expect(result.current).toEqual([])
  })

  it('handles null query results gracefully', () => {
    vi.mocked(useQuery).mockReturnValue(null)

    const { result } = renderHook(() => useDocumentProjects('doc1'))

    expect(result.current).toEqual([])
  })
})

describe('useDocumentProjectsTargeted', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up default mock implementation
    vi.mocked(useQuery).mockImplementation((query: any) => {
      // The targeted query returns a query object, not a function
      // We can check if it's not the getProjects$ constant
      if (query !== getProjects$) {
        return mockDocumentProjects.filter(dp => dp.documentId === 'doc1')
      }
      if (query === getProjects$) {
        return mockProjects
      }
      return []
    })
  })

  it('returns projects associated with a document using targeted query', () => {
    const { result } = renderHook(() => useDocumentProjectsTargeted('doc1'))

    expect(result.current).toEqual([
      { id: 'proj1', name: 'Project 1', description: 'First project' },
      { id: 'proj2', name: 'Project 2', description: 'Second project' },
    ])
  })

  it('returns empty array when document has no projects', () => {
    vi.mocked(useQuery).mockImplementation((query: any) => {
      if (query !== getProjects$) {
        return []
      }
      if (query === getProjects$) {
        return mockProjects
      }
      return []
    })

    const { result } = renderHook(() => useDocumentProjectsTargeted('doc3'))

    expect(result.current).toEqual([])
  })

  it('handles null query results gracefully', () => {
    vi.mocked(useQuery).mockReturnValue(null)

    const { result } = renderHook(() => useDocumentProjectsTargeted('doc1'))

    expect(result.current).toEqual([])
  })
})
