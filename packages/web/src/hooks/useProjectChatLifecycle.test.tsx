import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProjectChatLifecycle } from './useProjectChatLifecycle.js'
import { createProjectRoomDefinition } from '@work-squared/shared/rooms'
import type { Project } from '@work-squared/shared/schema'

const room = createProjectRoomDefinition({
  projectId: 'project-1',
  name: 'Project One',
})

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'Project One',
  description: 'Desc',
  category: null,
  attributes: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  deletedAt: null,
  archivedAt: null,
  ...overrides,
})

const mocks = vi.hoisted(() => {
  let workerValue: unknown[] | undefined = []
  let conversationValue: unknown[] | undefined = []

  return {
    mockCommit: vi.fn(() => Promise.resolve()),
    mockUseQuery: vi.fn((query: { label?: string } | undefined) => {
      if (!query) return undefined
      if (query.label?.includes('worker')) return workerValue
      if (query.label?.includes('conversation')) return conversationValue
      return undefined
    }),
    setWorkerValue: (value: unknown[] | undefined) => {
      workerValue = value
    },
    setConversationValue: (value: unknown[] | undefined) => {
      conversationValue = value
    },
  }
})

vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: { commit: mocks.mockCommit } }),
  useQuery: (query: any) => mocks.mockUseQuery(query),
}))

vi.mock('@work-squared/shared/queries', () => ({
  getWorkerById$: vi.fn(() => ({ label: 'worker-query' })),
  getConversationByRoom$: vi.fn(() => ({ label: 'conversation-query' })),
}))

describe('useProjectChatLifecycle', () => {
  beforeEach(() => {
    mocks.mockCommit.mockClear()
    mocks.mockUseQuery.mockClear()
    mocks.setWorkerValue([])
    mocks.setConversationValue([])
  })

  it('archives worker and conversation when project is archived', async () => {
    const archivedAt = new Date('2024-03-01T00:00:00Z')
    mocks.setWorkerValue([{ id: room.worker.id, status: 'active' }])
    mocks.setConversationValue([{ id: 'conversation-1', archivedAt: null }])
    const project = makeProject({ archivedAt })

    renderHook(() => useProjectChatLifecycle(project, room))

    await waitFor(() => expect(mocks.mockCommit).toHaveBeenCalledTimes(2))
  })

  it('restores worker and conversation when project is unarchived', async () => {
    mocks.setWorkerValue([{ id: room.worker.id, status: 'inactive' }])
    mocks.setConversationValue([
      { id: 'conversation-2', archivedAt: new Date('2024-02-01T00:00:00Z') },
    ])
    const project = makeProject({ archivedAt: null })

    renderHook(() => useProjectChatLifecycle(project, room))

    await waitFor(() => expect(mocks.mockCommit).toHaveBeenCalledTimes(2))
  })
})
