import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore } from '../../src/test-utils'
import { seedSessionDocuments } from '../../src/util/seed-data'
import { getDocumentList$ } from '../../src/livestore/queries'

describe('Document Seeding', () => {
  let store: any

  beforeEach(() => {
    store = createTestStore()
  })

  it('should seed 5 documents when none exist', async () => {
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

  it('should create documents with actual content', async () => {
    await seedSessionDocuments(store)

    const documents = store.query(getDocumentList$)
    const ethicsGuide = documents.find((doc: any) => doc.id === 'doc-ai-ethics-guide')

    expect(ethicsGuide).toBeDefined()
    expect(ethicsGuide.content).toContain('# AI Legal Ethics Guide')
    expect(ethicsGuide.content).toContain('## Introduction')
    expect(ethicsGuide.content).toContain('artificial intelligence into legal practice')
    expect(ethicsGuide.title).toBe('AI Legal Ethics Guide')
  })

  it('should create documents with different creation dates', async () => {
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

  it('should create documents with meaningful content for each type', async () => {
    await seedSessionDocuments(store)

    const documents = store.query(getDocumentList$)

    // Check each document has relevant content
    const ethicsGuide = documents.find((doc: any) => doc.id === 'doc-ai-ethics-guide')
    expect(ethicsGuide.content).toContain('ethical challenges')
    expect(ethicsGuide.content).toContain('Client Confidentiality')

    const roadmap = documents.find((doc: any) => doc.id === 'doc-implementation-roadmap')
    expect(roadmap.content).toContain('Phase 1')
    expect(roadmap.content).toContain('Infrastructure Assessment')

    const checklist = documents.find((doc: any) => doc.id === 'doc-vendor-evaluation')
    expect(checklist.content).toContain('Security and Compliance')
    expect(checklist.content).toContain('Encryption Standards')

    const bestPractices = documents.find((doc: any) => doc.id === 'doc-contract-review')
    expect(bestPractices.content).toContain('contract review processes')
    expect(bestPractices.content).toContain('Quality Control Framework')

    const researchStrategies = documents.find((doc: any) => doc.id === 'doc-legal-research')
    expect(researchStrategies.content).toContain('legal research')
    expect(researchStrategies.content).toContain('Case Law Research')
  })

  it('should handle multiple seeding calls gracefully', async () => {
    // First seeding
    await seedSessionDocuments(store)
    const firstDocuments = store.query(getDocumentList$)
    expect(firstDocuments).toHaveLength(5)

    // Second seeding should add more documents (not replace)
    await seedSessionDocuments(store)
    const secondDocuments = store.query(getDocumentList$)
    expect(secondDocuments).toHaveLength(10) // 5 + 5 = 10
  })
})
