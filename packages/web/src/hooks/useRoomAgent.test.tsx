import { renderHook, waitFor } from '../../tests/test-utils.js'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { getCategoryRoomDefinition } from '@lifebuild/shared/rooms'
import { useRoomAgent } from './useRoomAgent.js'

const mocks = vi.hoisted(() => {
  let queryValue: unknown[] | undefined = []
  return {
    mockCommit: vi.fn(() => Promise.resolve()),
    mockUseQuery: vi.fn(() => queryValue),
    resetQuery: () => {
      queryValue = []
    },
    setQueryValue: (value: unknown[] | undefined) => {
      queryValue = value
    },
  }
})

vi.mock('../livestore-compat.js', () => ({
  useStore: () => ({ store: { commit: mocks.mockCommit } }),
  useQuery: mocks.mockUseQuery,
}))

vi.mock('@lifebuild/shared/queries', () => ({
  getWorkerById$: vi.fn(() => ({ label: 'worker-query' })),
}))

describe('useRoomAgent', () => {
  beforeEach(() => {
    mocks.mockCommit.mockClear()
    mocks.mockUseQuery.mockClear()
    mocks.resetQuery()
  })

  it('creates a worker once even if multiple components mount simultaneously', async () => {
    const room = getCategoryRoomDefinition('health')

    const first = renderHook(() => useRoomAgent(room))
    const second = renderHook(() => useRoomAgent(room))

    await waitFor(() => expect(mocks.mockCommit).toHaveBeenCalledTimes(1))

    first.unmount()
    second.unmount()
  })

  it('skips creation when the worker already exists', () => {
    const room = getCategoryRoomDefinition('finances')
    mocks.setQueryValue([
      {
        id: room.worker.id,
        name: room.worker.name,
        roleDescription: room.worker.roleDescription,
        systemPrompt: room.worker.prompt,
        avatar: null,
        defaultModel: room.worker.defaultModel,
        roomId: room.roomId,
        roomKind: room.roomKind,
        status: 'active',
      },
    ])

    const { unmount } = renderHook(() => useRoomAgent(room))

    expect(mocks.mockCommit).not.toHaveBeenCalled()
    unmount()
  })
})
