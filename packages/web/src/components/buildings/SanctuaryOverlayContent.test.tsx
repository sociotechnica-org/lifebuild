import React from 'react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen } from '../../../tests/test-utils.js'
import { SanctuaryOverlayContent } from './SanctuaryOverlayContent.js'
import { useQuery, useStore } from '../../livestore-compat.js'
import { useAttendantRail } from '../layout/AttendantRailProvider.js'
import { SANCTUARY_FIRST_VISIT_BOOTSTRAP_PREFIX } from '../../constants/sanctuary.js'

vi.mock('../../livestore-compat.js', () => ({
  useQuery: vi.fn(),
  useStore: vi.fn(),
}))

vi.mock('../layout/AttendantRailProvider.js', () => ({
  useAttendantRail: vi.fn(),
}))

const mockCommit = vi.fn()
const mockOpenAttendant = vi.fn()
const mockQueueAttendantMessage = vi.fn()
const mockedUseQuery = vi.mocked(useQuery)
const mockedUseStore = vi.mocked(useStore)
const mockedUseAttendantRail = vi.mocked(useAttendantRail)

describe('SanctuaryOverlayContent', () => {
  beforeEach(() => {
    mockCommit.mockReset()
    mockOpenAttendant.mockReset()
    mockQueueAttendantMessage.mockReset()
    mockedUseStore.mockReturnValue({ store: { commit: mockCommit } } as any)
    mockedUseAttendantRail.mockReturnValue({
      openAttendant: mockOpenAttendant,
      queueAttendantMessage: mockQueueAttendantMessage,
    } as any)
  })

  it('shows first-visit welcome and bootstraps Jarvis greeting', () => {
    mockedUseQuery.mockReturnValue([])

    render(<SanctuaryOverlayContent />)

    expect(screen.getByRole('heading', { name: 'Sanctuary' })).toBeInTheDocument()
    expect(screen.getByTestId('sanctuary-first-visit-welcome')).toBeInTheDocument()
    expect(screen.getByText('Jarvis is here to guide your Visioning.')).toBeInTheDocument()
    expect(mockOpenAttendant).toHaveBeenCalledWith('jarvis')
    expect(mockQueueAttendantMessage).toHaveBeenCalledWith(
      'jarvis',
      expect.stringContaining(SANCTUARY_FIRST_VISIT_BOOTSTRAP_PREFIX)
    )
    expect(mockCommit).toHaveBeenCalledTimes(1)
  })

  it('renders the normal sanctuary content after first visit has been recorded', () => {
    mockedUseQuery.mockReturnValue([
      {
        key: 'journey.sanctuaryFirstVisitCompletedAt',
        value: '2026-02-27T00:00:00.000Z',
        updatedAt: new Date(),
      } as any,
    ])

    render(<SanctuaryOverlayContent />)

    expect(screen.getByRole('heading', { name: 'Sanctuary' })).toBeInTheDocument()
    expect(screen.getByTestId('sanctuary-charter-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Visioning in the Sanctuary is coming soon.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Jarvis is ready in the Attendant Rail while we build the guided charter space for the Builder.'
      )
    ).toBeInTheDocument()
    expect(mockOpenAttendant).not.toHaveBeenCalled()
    expect(mockQueueAttendantMessage).not.toHaveBeenCalled()
    expect(mockCommit).not.toHaveBeenCalled()
  })

  it('renders loading state while sanctuary visit state is resolving', () => {
    mockedUseQuery.mockReturnValue(undefined)

    render(<SanctuaryOverlayContent />)

    expect(screen.getByText('Preparing Sanctuary...')).toBeInTheDocument()
    expect(mockOpenAttendant).not.toHaveBeenCalled()
    expect(mockQueueAttendantMessage).not.toHaveBeenCalled()
    expect(mockCommit).not.toHaveBeenCalled()
  })
})
