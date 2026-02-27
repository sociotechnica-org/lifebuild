import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type PlacementSource = 'panel' | 'workshop'

type PlacementContextValue = {
  placementProjectId: string | null
  placementSource: PlacementSource | null
  selectedPlacedProjectId: string | null
  isSelectingPlacedProject: boolean
  isPlacing: boolean
  startPlacement: (projectId: string, options?: { source?: PlacementSource }) => void
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
  const [placementSource, setPlacementSource] = useState<PlacementSource | null>(null)
  const [selectedPlacedProjectId, setSelectedPlacedProjectId] = useState<string | null>(null)
  const [isSelectingPlacedProject, setIsSelectingPlacedProject] = useState(false)

  const startPlacement = useCallback(
    (projectId: string, options?: { source?: PlacementSource }) => {
      setPlacementProjectId(projectId)
      setPlacementSource(options?.source ?? 'panel')
      setSelectedPlacedProjectId(null)
      setIsSelectingPlacedProject(false)
    },
    []
  )

  const clearPlacement = useCallback(() => {
    setPlacementProjectId(null)
    setPlacementSource(null)
  }, [])

  const startSelectingPlacedProject = useCallback(() => {
    setIsSelectingPlacedProject(true)
    setPlacementProjectId(null)
    setPlacementSource(null)
    setSelectedPlacedProjectId(null)
  }, [])

  const selectPlacedProject = useCallback((projectId: string) => {
    setSelectedPlacedProjectId(projectId)
    setIsSelectingPlacedProject(false)
    setPlacementProjectId(null)
    setPlacementSource(null)
  }, [])

  const clearPlacedProjectSelection = useCallback(() => {
    setSelectedPlacedProjectId(null)
    setIsSelectingPlacedProject(false)
  }, [])

  const clearAll = useCallback(() => {
    setPlacementProjectId(null)
    setPlacementSource(null)
    setSelectedPlacedProjectId(null)
    setIsSelectingPlacedProject(false)
  }, [])

  const value = useMemo(
    () => ({
      placementProjectId,
      placementSource,
      selectedPlacedProjectId,
      isSelectingPlacedProject,
      isPlacing: placementProjectId !== null,
      startPlacement,
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
      placementSource,
      selectPlacedProject,
      selectedPlacedProjectId,
      startPlacement,
      startSelectingPlacedProject,
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
