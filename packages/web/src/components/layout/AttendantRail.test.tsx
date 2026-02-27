import React from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { AttendantRail } from './AttendantRail.js'
import type { AttendantId } from './AttendantRailProvider.js'
import { getRouteAutoSelectedAttendant } from './AttendantRailProvider.js'

const RailHarness: React.FC<{ notifications?: Partial<Record<AttendantId, boolean>> }> = ({
  notifications,
}) => {
  const [activeAttendantId, setActiveAttendantId] = React.useState<AttendantId | null>(null)

  return (
    <AttendantRail
      activeAttendantId={activeAttendantId}
      notifications={notifications}
      onAttendantClick={id => {
        setActiveAttendantId(current => (current === id ? null : id))
      }}
    />
  )
}

describe('AttendantRail', () => {
  it('renders Jarvis and Marvin avatar buttons', () => {
    render(<RailHarness />)

    expect(screen.getByTestId('attendant-rail-avatar-jarvis')).toBeInTheDocument()
    expect(screen.getByTestId('attendant-rail-avatar-marvin')).toBeInTheDocument()
    expect(screen.getByText('J')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
  })

  it('toggles the same attendant closed on second click', () => {
    render(<RailHarness />)

    const jarvisButton = screen.getByTestId('attendant-rail-avatar-jarvis')

    expect(jarvisButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(jarvisButton)
    expect(jarvisButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(jarvisButton)
    expect(jarvisButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches active attendant when selecting the other avatar', () => {
    render(<RailHarness />)

    const jarvisButton = screen.getByTestId('attendant-rail-avatar-jarvis')
    const marvinButton = screen.getByTestId('attendant-rail-avatar-marvin')

    fireEvent.click(jarvisButton)
    expect(jarvisButton).toHaveAttribute('aria-pressed', 'true')
    expect(marvinButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(marvinButton)
    expect(jarvisButton).toHaveAttribute('aria-pressed', 'false')
    expect(marvinButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders notification pips when enabled via props', () => {
    render(<RailHarness notifications={{ marvin: true }} />)

    expect(screen.queryByTestId('attendant-rail-notification-jarvis')).not.toBeInTheDocument()
    expect(screen.getByTestId('attendant-rail-notification-marvin')).toBeInTheDocument()
  })

  it('maps sanctuary, workshop, and project routes to attendant auto-selection', () => {
    expect(getRouteAutoSelectedAttendant('/sanctuary')).toBe('jarvis')
    expect(getRouteAutoSelectedAttendant('/workshop')).toBe('marvin')
    expect(getRouteAutoSelectedAttendant('/projects/project-123')).toBe('marvin')
    expect(getRouteAutoSelectedAttendant('/')).toBeNull()
  })
})
