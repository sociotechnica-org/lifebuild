import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { PlacementProvider, usePlacement } from './PlacementContext.js'

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <PlacementProvider>{children}</PlacementProvider>
}

describe('PlacementContext', () => {
  it('starts placement mode for the selected unplaced project', () => {
    const { result } = renderHook(() => usePlacement(), { wrapper })

    act(() => {
      result.current.startPlacement('project-1')
    })

    expect(result.current.placementProjectId).toBe('project-1')
    expect(result.current.isPlacing).toBe(true)
    expect(result.current.selectedPlacedProjectId).toBeNull()
    expect(result.current.isSelectingPlacedProject).toBe(false)
  })

  it('handles placed-project selection mode for removal flow', () => {
    const { result } = renderHook(() => usePlacement(), { wrapper })

    act(() => {
      result.current.startSelectingPlacedProject()
    })

    expect(result.current.isSelectingPlacedProject).toBe(true)
    expect(result.current.isPlacing).toBe(false)

    act(() => {
      result.current.selectPlacedProject('project-placed')
    })

    expect(result.current.isSelectingPlacedProject).toBe(false)
    expect(result.current.selectedPlacedProjectId).toBe('project-placed')
    expect(result.current.isPlacing).toBe(false)
  })

  it('clears all placement state', () => {
    const { result } = renderHook(() => usePlacement(), { wrapper })

    act(() => {
      result.current.startPlacement('project-1')
      result.current.selectPlacedProject('project-placed')
    })

    act(() => {
      result.current.clearAll()
    })

    expect(result.current.placementProjectId).toBeNull()
    expect(result.current.selectedPlacedProjectId).toBeNull()
    expect(result.current.isSelectingPlacedProject).toBe(false)
    expect(result.current.isPlacing).toBe(false)
  })
})
