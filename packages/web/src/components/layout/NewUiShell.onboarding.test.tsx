import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
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
  AttendantRail: ({
    notifications,
    visibleAttendantIds,
  }: {
    notifications?: { marvin?: boolean }
    visibleAttendantIds?: string[]
  }) => (
    <div data-testid='mock-attendant-rail'>
      {(visibleAttendantIds ?? ['jarvis', 'marvin']).join(',')}|
      {notifications?.marvin ? 'marvin-dot' : 'no-dot'}
    </div>
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

const renderFullBleedShell = () => {
  return render(
    <MemoryRouter>
      <NewUiShell fullBleed>
        <div>content</div>
      </NewUiShell>
    </MemoryRouter>
  )
}

describe('NewUiShell onboarding visibility gates', () => {
  it('shows Jarvis-only rail during campfire beat', () => {
    mockUseOnboarding.mockReturnValue({
      isActive: true,
      phase: 'campfire',
      isFogDismissed: false,
      uiPolicy: {
        showAttendantRail: true,
        showTaskQueue: false,
        railFadingIn: false,
        showFogOverlay: true,
        showMarvinNotification: false,
      },
    })

    renderShell()

    expect(screen.queryByTestId('mock-task-queue')).toBeNull()
    expect(screen.getByTestId('mock-attendant-rail')).toHaveTextContent('jarvis|no-dot')
    expect(screen.getByTestId('mock-attendant-chat')).toBeInTheDocument()
  })

  it('shows rail and marvin notification after reveal', () => {
    mockUseOnboarding.mockReturnValue({
      isActive: true,
      phase: 'reveal',
      isFogDismissed: false,
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
    expect(screen.getByTestId('mock-attendant-rail')).toHaveTextContent('jarvis,marvin|marvin-dot')
    expect(screen.getByTestId('mock-attendant-chat')).toBeInTheDocument()
  })

  it('shows a dev debug panel in full-bleed mode and toggles fog state', () => {
    const dismissFogOverlay = vi.fn()
    const resetFogOverlay = vi.fn()
    mockUseOnboarding.mockReturnValue({
      isActive: true,
      phase: 'campfire',
      isFogDismissed: false,
      dismissFogOverlay,
      resetFogOverlay,
      uiPolicy: {
        showAttendantRail: true,
        showTaskQueue: false,
        railFadingIn: false,
        showFogOverlay: true,
        showMarvinNotification: false,
      },
    })

    renderFullBleedShell()

    expect(screen.getByTestId('dev-debug-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('dev-debug-slider-sanctuary-scale')).toBeNull()
    fireEvent.click(screen.getByTestId('dev-debug-panel-button'))
    expect(screen.getByTestId('dev-debug-slider-sanctuary-scale')).toBeInTheDocument()
    expect(screen.getByTestId('dev-debug-slider-workshop-scale')).toBeInTheDocument()
    expect(screen.getByTestId('dev-debug-slider-tree-west-scale')).toBeInTheDocument()
    expect(screen.getByTestId('dev-debug-input-sanctuary-origin-x')).toBeInTheDocument()
    expect(screen.getByTestId('dev-debug-input-tree-west-origin-y')).toBeInTheDocument()
    const fogToggle = screen.getByTestId('dev-debug-toggle-fog')
    fireEvent.click(fogToggle)

    expect(dismissFogOverlay).toHaveBeenCalledTimes(1)
    expect(resetFogOverlay).not.toHaveBeenCalled()
  })
})
