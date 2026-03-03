import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { LiveStoreStatus } from './LiveStoreStatus.js'

const mockUseLiveStoreConnection = vi.fn()
const mockUseLiveStoreRepairContext = vi.fn()

vi.mock('../../hooks/useLiveStoreConnection.js', () => ({
  useLiveStoreConnection: () => mockUseLiveStoreConnection(),
}))

vi.mock('../../contexts/LiveStoreRepairContext.js', () => ({
  useLiveStoreRepairContext: () => mockUseLiveStoreRepairContext(),
}))

describe('LiveStoreStatus', () => {
  beforeEach(() => {
    mockUseLiveStoreConnection.mockReturnValue({
      networkStatus: { isConnected: true, timestampMs: Date.now() },
      syncStatus: { isSynced: true, pendingCount: 0 },
      lastConnectedAt: new Date('2026-03-03T11:21:00.000Z'),
      lastSyncUpdateAt: new Date('2026-03-03T11:21:00.000Z'),
    })

    mockUseLiveStoreRepairContext.mockReturnValue({
      requestRepair: vi.fn(),
      repairSuggestion: null,
      clearRepairSuggestion: vi.fn(),
      repairState: null,
    })
  })

  it('anchors tooltip to the right of the status dot', () => {
    render(<LiveStoreStatus />)

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(tooltip).toHaveClass('left-full')
    expect(tooltip).toHaveClass('top-1/2')
    expect(tooltip).toHaveClass('ml-2')
    expect(tooltip).toHaveClass('-translate-y-1/2')
  })

  it('hides manual repair action when there is no repair suggestion', () => {
    render(<LiveStoreStatus />)

    fireEvent.mouseEnter(screen.getByRole('button'))

    expect(screen.queryByRole('button', { name: 'Repair local data' })).not.toBeInTheDocument()
  })

  it('shows manual repair action when a repair suggestion exists', () => {
    mockUseLiveStoreRepairContext.mockReturnValue({
      requestRepair: vi.fn(),
      repairSuggestion: {
        storeId: 'store-1',
        suggestedAt: Date.now(),
        reason: 'Detected stale head mismatch.',
      },
      clearRepairSuggestion: vi.fn(),
      repairState: null,
    })

    render(<LiveStoreStatus />)
    fireEvent.mouseEnter(screen.getByRole('button'))

    expect(screen.getByRole('button', { name: 'Repair local data' })).toBeInTheDocument()
  })
})
