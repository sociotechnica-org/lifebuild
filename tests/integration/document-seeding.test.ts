import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createTestStore } from '../../src/test-utils'
import { seedSessionDocuments } from '../../src/util/seed-data'
import { getDocumentList$ } from '../../src/livestore/queries'

// Mock fetch for document content loading
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Document Seeding', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore()
    mockFetch.mockClear()
  })

  it('should seed 5 documents when none exist', async () => {
    // Mock successful fetch responses for all seed documents
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Mock Document Content\n\nThis is test content.'),
    })

    // Initial state - no documents
    const initialDocuments = store.query(getDocumentList$)
    expect(initialDocuments).toHaveLength(0)

    // Seed documents
    await seedSessionDocuments(store)

    // Verify documents were created
    const documents = store.query(getDocumentList$)
    expect(documents).toHaveLength(5)

    // Verify document structure
    const firstDoc = documents[0]
    expect(firstDoc).toHaveProperty('id')
    expect(firstDoc).toHaveProperty('title')
    expect(firstDoc).toHaveProperty('content')
    expect(firstDoc).toHaveProperty('createdAt')
    expect(firstDoc).toHaveProperty('updatedAt')
    expect(firstDoc).toHaveProperty('archivedAt', null)
  })

  it('should create documents with specific titles and IDs', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Test Content'),
    })

    await seedSessionDocuments(store)

    const documents = store.query(getDocumentList$)
    const titles = documents.map((doc: any) => doc.title)
    const ids = documents.map((doc: any) => doc.id)

    expect(titles).toContain('AI Legal Ethics Guide')
    expect(titles).toContain('AI Implementation Roadmap for Law Firms')
    expect(titles).toContain('AI Vendor Evaluation Checklist')
    expect(titles).toContain('AI Contract Review Best Practices')
    expect(titles).toContain('AI Legal Research Strategies')

    expect(ids).toContain('doc-ai-ethics-guide')
    expect(ids).toContain('doc-implementation-roadmap')
    expect(ids).toContain('doc-vendor-evaluation')
    expect(ids).toContain('doc-contract-review')
    expect(ids).toContain('doc-legal-research')
  })

  it('should handle fetch failures gracefully with placeholder content', async () => {
    // Mock fetch to fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
    })

    await seedSessionDocuments(store)

    const documents = store.query(getDocumentList$)
    expect(documents).toHaveLength(5)

    // Check that placeholder content was used
    const firstDoc = documents[0]
    expect(firstDoc.content).toContain('# ')
    expect(firstDoc.content).toContain('This document provides guidance')
    expect(firstDoc.content).toContain('Content will be loaded when available')
  })

  it('should handle network errors gracefully', async () => {
    // Mock fetch to throw an error
    mockFetch.mockRejectedValue(new Error('Network error'))

    await seedSessionDocuments(store)

    const documents = store.query(getDocumentList$)
    expect(documents).toHaveLength(5)

    // Check that placeholder content was used for all documents
    documents.forEach((doc: any) => {
      expect(doc.content).toContain('Content will be loaded when available')
    })
  })

  it('should create documents with different creation dates', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Test Content'),
    })

    await seedSessionDocuments(store)

    const documents = store.query(getDocumentList$)
    const creationDates = documents.map((doc: any) => doc.createdAt.getTime())

    // All documents should have different creation dates
    const uniqueDates = new Set(creationDates)
    expect(uniqueDates.size).toBe(5)

    // Documents should be created in chronological order (oldest first)
    for (let i = 1; i < creationDates.length; i++) {
      expect(creationDates[i]).toBeGreaterThan(creationDates[i - 1])
    }
  })

  it('should load actual content when fetch succeeds', async () => {
    const mockContent =
      '# AI Legal Ethics Guide\n\n## Introduction\n\nThis is the actual content from the markdown file.'

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockContent),
    })

    await seedSessionDocuments(store)

    const documents = store.query(getDocumentList$)
    const ethicsGuide = documents.find((doc: any) => doc.id === 'doc-ai-ethics-guide')

    expect(ethicsGuide).toBeDefined()
    expect(ethicsGuide.content).toBe(mockContent)
    expect(ethicsGuide.title).toBe('AI Legal Ethics Guide')
  })

  it('should make fetch requests for all seed documents', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('# Test Content'),
    })

    await seedSessionDocuments(store)

    // Verify fetch was called for each document
    expect(mockFetch).toHaveBeenCalledTimes(5)

    // Verify the correct URLs were called
    const calledUrls = mockFetch.mock.calls.map(call => call[0])
    expect(calledUrls).toContain('/docs/seed-content/ai-legal-ethics-guide.md')
    expect(calledUrls).toContain('/docs/seed-content/ai-implementation-roadmap.md')
    expect(calledUrls).toContain('/docs/seed-content/ai-vendor-evaluation-checklist.md')
    expect(calledUrls).toContain('/docs/seed-content/ai-contract-review-best-practices.md')
    expect(calledUrls).toContain('/docs/seed-content/ai-legal-research-strategies.md')
  })
})
