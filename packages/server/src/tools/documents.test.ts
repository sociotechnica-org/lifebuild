import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the schema imports before importing the module under test
vi.mock('@lifebuild/shared/schema', () => ({
  events: {
    documentUpdated: vi.fn(params => params),
    documentCreated: vi.fn(params => params),
  },
}))

vi.mock('@lifebuild/shared/queries', () => ({
  getDocumentById$: vi.fn((id: string) => `getDocumentById$:${id}`),
  getDocumentList$: 'getDocumentList$',
  searchDocuments$: vi.fn(),
  searchDocumentsWithProject$: vi.fn(),
  getAllDocuments$: 'getAllDocuments$',
  getDocumentProjectsByProject$: vi.fn(),
  getProjects$: 'getProjects$',
}))

// Import after mocks are set up
import type { UpdateDocumentParams } from './types.js'

describe('updateDocument', () => {
  let updateDocument: any
  let mockStore: any

  beforeEach(async () => {
    vi.clearAllMocks()

    // Create mock store
    mockStore = {
      query: vi.fn(),
      commit: vi.fn(),
    }

    // Dynamic import to get the mocked version
    const documentsModule = await import('./documents.js')
    updateDocument = documentsModule.updateDocument
  })

  it('should return error when neither title nor content is provided', () => {
    // Mock document exists
    mockStore.query.mockReturnValue([
      { id: 'doc-1', title: 'Existing Doc', content: 'Existing content' },
    ])

    const result = updateDocument(mockStore, { documentId: 'doc-1' } as UpdateDocumentParams)

    expect(result.success).toBe(false)
    expect(result.error).toContain('At least one field (title or content) must be provided')
    expect(result.error).toContain('documentId="doc-1"')
    expect(result.error).toContain('Please include a "title" and/or "content" parameter')
  })

  it('should succeed when title is provided', () => {
    mockStore.query.mockReturnValue([
      { id: 'doc-1', title: 'Old Title', content: 'Existing content' },
    ])

    const result = updateDocument(mockStore, {
      documentId: 'doc-1',
      title: 'New Title',
    } as UpdateDocumentParams)

    expect(result.success).toBe(true)
    expect(result.document.title).toBe('New Title')
    // Should include the existing content in the response
    expect(result.document.content).toBe('Existing content')
    expect(mockStore.commit).toHaveBeenCalled()
  })

  it('should succeed when content is provided', () => {
    mockStore.query.mockReturnValue([
      { id: 'doc-1', title: 'Existing Title', content: 'Old content' },
    ])

    const result = updateDocument(mockStore, {
      documentId: 'doc-1',
      content: 'New content',
    } as UpdateDocumentParams)

    expect(result.success).toBe(true)
    expect(result.document.content).toBe('New content')
    // Should include the existing title in the response
    expect(result.document.title).toBe('Existing Title')
    expect(mockStore.commit).toHaveBeenCalled()
  })

  it('should succeed when both title and content are provided', () => {
    mockStore.query.mockReturnValue([{ id: 'doc-1', title: 'Old Title', content: 'Old content' }])

    const result = updateDocument(mockStore, {
      documentId: 'doc-1',
      title: 'New Title',
      content: 'New content',
    } as UpdateDocumentParams)

    expect(result.success).toBe(true)
    expect(result.document.title).toBe('New Title')
    expect(result.document.content).toBe('New content')
    expect(mockStore.commit).toHaveBeenCalled()
  })

  it('should return error when document is not found', () => {
    mockStore.query.mockReturnValue([])

    const result = updateDocument(mockStore, {
      documentId: 'nonexistent',
      title: 'New Title',
    } as UpdateDocumentParams)

    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('should return error when title is empty string', () => {
    mockStore.query.mockReturnValue([
      { id: 'doc-1', title: 'Existing Title', content: 'Existing content' },
    ])

    const result = updateDocument(mockStore, {
      documentId: 'doc-1',
      title: '   ',
    } as UpdateDocumentParams)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Document title cannot be empty')
  })

  it('should trim title and content', () => {
    mockStore.query.mockReturnValue([{ id: 'doc-1', title: 'Old Title', content: 'Old content' }])

    const result = updateDocument(mockStore, {
      documentId: 'doc-1',
      title: '  New Title  ',
      content: '  New content  ',
    } as UpdateDocumentParams)

    expect(result.success).toBe(true)
    expect(result.document.title).toBe('New Title')
    expect(result.document.content).toBe('New content')
  })
})
