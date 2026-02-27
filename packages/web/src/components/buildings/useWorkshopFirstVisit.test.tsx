import { renderHook, waitFor } from '../../../tests/test-utils.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SETTINGS_KEYS } from '@lifebuild/shared'
import { useWorkshopFirstVisit } from './useWorkshopFirstVisit.js'

const mocks = vi.hoisted(() => {
  let settingRows: Array<{ key: string; value: string }> | undefined = []

  return {
    mockCommit: vi.fn((_event?: unknown) => Promise.resolve()),
    mockOpenAttendant: vi.fn(),
    mockSendDirectMessage: vi.fn(() => true),
    mockUseQuery: vi.fn((_query?: unknown) => settingRows),
    setSettingRows: (rows: Array<{ key: string; value: string }> | undefined) => {
      settingRows = rows
    },
  }
})

vi.mock('../../livestore-compat.js', () => ({
  useStore: () => ({ store: { commit: mocks.mockCommit } }),
  useQuery: (query: unknown) => mocks.mockUseQuery(query),
}))

vi.mock('../../hooks/useRoomChat.js', () => ({
  useRoomChat: () => ({
    sendDirectMessage: mocks.mockSendDirectMessage,
  }),
}))

vi.mock('../layout/AttendantRailProvider.js', () => ({
  useAttendantRail: () => ({
    openAttendant: mocks.mockOpenAttendant,
  }),
}))

describe('useWorkshopFirstVisit', () => {
  beforeEach(() => {
    mocks.setSettingRows([])
    mocks.mockCommit.mockClear()
    mocks.mockOpenAttendant.mockClear()
    mocks.mockSendDirectMessage.mockClear()
    mocks.mockUseQuery.mockClear()
    mocks.mockSendDirectMessage.mockReturnValue(true)
  })

  it('starts first-visit flow and persists completion when no completion setting exists', async () => {
    const { result, rerender } = renderHook(() => useWorkshopFirstVisit())

    await waitFor(() => {
      expect(result.current.showFirstVisitGreeting).toBe(true)
    })

    await waitFor(() => {
      expect(mocks.mockOpenAttendant).toHaveBeenCalledWith('marvin')
      expect(mocks.mockSendDirectMessage).toHaveBeenCalledTimes(1)
      expect(mocks.mockCommit).toHaveBeenCalledTimes(1)
    })

    const committedEvent = mocks.mockCommit.mock.calls[0]?.[0] as unknown as {
      args?: { key?: string }
    }
    expect(committedEvent.args?.key).toBe(SETTINGS_KEYS.JOURNEY_WORKSHOP_UNBURDENING_COMPLETED_AT)

    rerender()
    expect(mocks.mockSendDirectMessage).toHaveBeenCalledTimes(1)
    expect(mocks.mockCommit).toHaveBeenCalledTimes(1)
  })

  it('skips first-visit flow when completion setting already exists', () => {
    mocks.setSettingRows([
      {
        key: SETTINGS_KEYS.JOURNEY_WORKSHOP_UNBURDENING_COMPLETED_AT,
        value: '2026-02-27T00:00:00.000Z',
      },
    ])

    const { result } = renderHook(() => useWorkshopFirstVisit())

    expect(result.current.showFirstVisitGreeting).toBe(false)
    expect(mocks.mockOpenAttendant).not.toHaveBeenCalled()
    expect(mocks.mockSendDirectMessage).not.toHaveBeenCalled()
    expect(mocks.mockCommit).not.toHaveBeenCalled()
  })
})
