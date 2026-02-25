import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type PlacementContextValue = {
  placementProjectId: string | null
  placementSystemId: string | null
  selectedPlacedProjectId: string | null
  isSelectingPlacedProject: boolean
  isPlacing: boolean
  startPlacement: (projectId: string) => void
  startSystemPlacement: (systemId: string) => void
  clearPlacement: () => void
  startSelectingPlacedProject: () => void
  selectPlacedProject: (projectId: string) => void
  clearPlacedProjectSelection: () => void
  clearAll: () => void
}

const PlacementContext = createContext<PlacementContextValue | undefined>(undefined)

type PlacementProviderProps = {
  children: React.ReactNode
}

export function PlacementProvider({ children }: PlacementProviderProps) {
  const [placementProjectId, setPlacementProjectId] = useState<string | null>(null)
  const [placementSystemId, setPlacementSystemId] = useState<string | null>(null)
  const [selectedPlacedProjectId, setSelectedPlacedProjectId] = useState<string | null>(null)
  const [isSelectingPlacedProject, setIsSelectingPlacedProject] = useState(false)

  const startPlacement = useCallback((projectId: string) => {
    setPlacementProjectId(projectId)
    setPlacementSystemId(null)
    setSelectedPlacedProjectId(null)
    setIsSelectingPlacedProject(false)
  }, [])

  const startSystemPlacement = useCallback((systemId: string) => {
    setPlacementSystemId(systemId)
    setPlacementProjectId(null)
    setSelectedPlacedProjectId(null)
    setIsSelectingPlacedProject(false)
  }, [])

  const clearPlacement = useCallback(() => {
    setPlacementProjectId(null)
    setPlacementSystemId(null)
  }, [])

  const startSelectingPlacedProject = useCallback(() => {
    setIsSelectingPlacedProject(true)
    setPlacementProjectId(null)
    setPlacementSystemId(null)
    setSelectedPlacedProjectId(null)
  }, [])

  const selectPlacedProject = useCallback((projectId: string) => {
    setSelectedPlacedProjectId(projectId)
    setIsSelectingPlacedProject(false)
    setPlacementProjectId(null)
    setPlacementSystemId(null)
  }, [])

  const clearPlacedProjectSelection = useCallback(() => {
    setSelectedPlacedProjectId(null)
    setIsSelectingPlacedProject(false)
  }, [])

  const clearAll = useCallback(() => {
    setPlacementProjectId(null)
    setPlacementSystemId(null)
    setSelectedPlacedProjectId(null)
    setIsSelectingPlacedProject(false)
  }, [])

  const value = useMemo(
    () => ({
      placementProjectId,
      placementSystemId,
      selectedPlacedProjectId,
      isSelectingPlacedProject,
      isPlacing: placementProjectId !== null || placementSystemId !== null,
      startPlacement,
      startSystemPlacement,
      clearPlacement,
      startSelectingPlacedProject,
      selectPlacedProject,
      clearPlacedProjectSelection,
      clearAll,
    }),
    [
      clearAll,
      clearPlacement,
      clearPlacedProjectSelection,
      isSelectingPlacedProject,
      placementProjectId,
      placementSystemId,
      selectPlacedProject,
      selectedPlacedProjectId,
      startPlacement,
      startSelectingPlacedProject,
      startSystemPlacement,
    ]
  )

  return <PlacementContext.Provider value={value}>{children}</PlacementContext.Provider>
}

export function usePlacement() {
  const context = useContext(PlacementContext)
  if (!context) {
    throw new Error('usePlacement must be used inside PlacementProvider')
  }
  return context
}
