import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '../../../tests/test-utils.js'
import { NewUiShell } from './NewUiShell.js'

const mockUseOnboarding = vi.fn()

vi.mock('../onboarding/useOnboarding.js', () => ({
  useOnboarding: () => mockUseOnboarding(),
}))

vi.mock('./AttendantRailProvider.js', () => ({
  useAttendantRail: () => ({
    activeAttendantId: null,
    openAttendant: vi.fn(),
    closeAttendant: vi.fn(),
    toggleAttendant: vi.fn(),
    attendants: {},
  }),
}))

vi.mock('./AttendantRail.js', () => ({
  AttendantRail: ({ notifications }: { notifications?: { marvin?: boolean } }) => (
    <div data-testid='mock-attendant-rail'>{notifications?.marvin ? 'marvin-dot' : 'no-dot'}</div>
  ),
}))

vi.mock('./AttendantChatPanel.js', () => ({
  AttendantChatPanel: () => <div data-testid='mock-attendant-chat'>chat</div>,
}))

vi.mock('../task-queue/TaskQueuePanel.js', () => ({
  TaskQueuePanel: () => <div data-testid='mock-task-queue'>queue</div>,
}))

vi.mock('../../contexts/AuthContext.js', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}))

vi.mock('../../livestore-compat.js', () => ({
  useQuery: () => [],
}))

vi.mock('../../lib/analytics.js', () => ({
  usePostHog: () => null,
}))

const renderShell = () => {
  return render(
    <MemoryRouter>
      <NewUiShell>
        <div>content</div>
      </NewUiShell>
    </MemoryRouter>
  )
}

describe('NewUiShell onboarding visibility gates', () => {
  it('hides task queue and attendant rail during campfire beat', () => {
    mockUseOnboarding.mockReturnValue({
      uiPolicy: {
        showAttendantRail: false,
        showTaskQueue: false,
        railFadingIn: false,
        showFogOverlay: true,
        showMarvinNotification: false,
      },
    })

    renderShell()

    expect(screen.queryByTestId('mock-task-queue')).toBeNull()
    expect(screen.queryByTestId('mock-attendant-rail')).toBeNull()
    expect(screen.queryByTestId('mock-attendant-chat')).toBeNull()
  })

  it('shows rail and marvin notification after reveal', () => {
    mockUseOnboarding.mockReturnValue({
      uiPolicy: {
        showAttendantRail: true,
        showTaskQueue: true,
        railFadingIn: false,
        showFogOverlay: false,
        showMarvinNotification: true,
      },
    })

    renderShell()

    expect(screen.getByTestId('mock-task-queue')).toBeInTheDocument()
    expect(screen.getByTestId('mock-attendant-rail')).toHaveTextContent('marvin-dot')
    expect(screen.getByTestId('mock-attendant-chat')).toBeInTheDocument()
  })
})
