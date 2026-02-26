import type { HexCoord } from '@lifebuild/shared/hex'
import { Canvas } from '@react-three/fiber'
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { CameraRig } from './CameraRig.js'
import { HexGrid, type PlacedHexTile, type PlacedSystemTile } from './HexGrid.js'
import { PlacementProvider, usePlacement } from './PlacementContext.js'
import {
  UnplacedPanel,
  type PanelArchivedProjectItem,
  type PanelCompletedProjectItem,
  type PanelProjectItem,
  type PanelSystemItem,
} from './UnplacedPanel.js'

const FIRST_PLACEMENT_PROMPT_KEY = 'life-map-placement-first-run-dismissed-v1'

const canUseLocalStorage = (): boolean => {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return typeof window.localStorage !== 'undefined'
  } catch {
    return false
  }
}

const isFirstPlacementPromptDismissed = (): boolean => {
  if (!canUseLocalStorage()) {
    return false
  }

  try {
    return window.localStorage.getItem(FIRST_PLACEMENT_PROMPT_KEY) === '1'
  } catch {
    return false
  }
}

const persistFirstPlacementPromptDismissed = (): void => {
  if (!canUseLocalStorage()) {
    return
  }

  try {
    window.localStorage.setItem(FIRST_PLACEMENT_PROMPT_KEY, '1')
  } catch {
    // Ignore storage failures so placement UI remains usable.
  }
}

const shouldShowFirstPlacementPrompt = (hasUnplacedEntities: boolean): boolean => {
  if (!hasUnplacedEntities) {
    return false
  }

  return !isFirstPlacementPromptDismissed()
}

type HexMapProps = {
  tiles?: readonly PlacedHexTile[]
  systemTiles?: readonly PlacedSystemTile[]
  unplacedProjects?: readonly PanelProjectItem[]
  unplacedSystems?: readonly PanelSystemItem[]
  completedProjects?: readonly PanelCompletedProjectItem[]
  archivedProjects?: readonly PanelArchivedProjectItem[]
  onPlaceProject?: (projectId: string, coord: HexCoord) => Promise<void> | void
  onPlaceSystem?: (systemId: string, coord: HexCoord) => Promise<void> | void
  onRemovePlacedProject?: (projectId: string) => Promise<void> | void
  onSelectUnplacedProject?: (projectId: string) => void
  onOpenProject?: (projectId: string) => void
  onOpenSystem?: (systemId: string) => void
  onUnarchiveProject?: (projectId: string) => void
}

const HexMapSurface: React.FC<HexMapProps> = ({
  tiles = [],
  systemTiles = [],
  unplacedProjects = [],
  unplacedSystems = [],
  completedProjects = [],
  archivedProjects = [],
  onPlaceProject,
  onPlaceSystem,
  onRemovePlacedProject,
  onSelectUnplacedProject,
  onOpenProject,
  onOpenSystem,
  onUnarchiveProject,
}) => {
  const {
    placementProjectId,
    placementSystemId,
    selectedPlacedProjectId,
    isSelectingPlacedProject,
    isPlacing,
    startPlacement,
    startSystemPlacement,
    clearPlacement,
    startSelectingPlacedProject,
    selectPlacedProject,
    clearPlacedProjectSelection,
  } = usePlacement()

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [showFirstPlacementPrompt, setShowFirstPlacementPrompt] = useState(() =>
    shouldShowFirstPlacementPrompt(unplacedProjects.length > 0 || unplacedSystems.length > 0)
  )

  const unplacedProjectsById = useMemo(() => {
    return new Map(unplacedProjects.map(project => [project.id, project]))
  }, [unplacedProjects])

  const unplacedSystemsById = useMemo(() => {
    return new Map(unplacedSystems.map(system => [system.id, system]))
  }, [unplacedSystems])

  const placedProjectsById = useMemo(() => {
    return new Map(
      tiles.map(tile => [
        tile.projectId,
        { id: tile.projectId, name: tile.projectName, category: tile.category ?? null },
      ])
    )
  }, [tiles])

  const selectedPlacementProject = placementProjectId
    ? (unplacedProjectsById.get(placementProjectId) ?? null)
    : null

  const selectedPlacementSystem = placementSystemId
    ? (unplacedSystemsById.get(placementSystemId) ?? null)
    : null

  const selectedPlacedProject = selectedPlacedProjectId
    ? (placedProjectsById.get(selectedPlacedProjectId) ?? null)
    : null

  useEffect(() => {
    if (placementProjectId && !unplacedProjectsById.has(placementProjectId)) {
      clearPlacement()
    }
  }, [clearPlacement, placementProjectId, unplacedProjectsById])

  useEffect(() => {
    if (placementSystemId && !unplacedSystemsById.has(placementSystemId)) {
      clearPlacement()
    }
  }, [clearPlacement, placementSystemId, unplacedSystemsById])

  useEffect(() => {
    if (selectedPlacedProjectId && !placedProjectsById.has(selectedPlacedProjectId)) {
      clearPlacedProjectSelection()
    }
  }, [clearPlacedProjectSelection, placedProjectsById, selectedPlacedProjectId])

  useEffect(() => {
    setShowFirstPlacementPrompt(
      shouldShowFirstPlacementPrompt(unplacedProjects.length > 0 || unplacedSystems.length > 0)
    )
  }, [unplacedProjects.length, unplacedSystems.length])

  useEffect(() => {
    if (showFirstPlacementPrompt) {
      setIsPanelCollapsed(false)
    }
  }, [showFirstPlacementPrompt])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      clearPlacement()
      clearPlacedProjectSelection()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [clearPlacement, clearPlacedProjectSelection])

  const dismissFirstPlacementPrompt = useCallback(() => {
    setShowFirstPlacementPrompt(false)
    persistFirstPlacementPromptDismissed()
  }, [])

  const handlePointerMissed = useCallback(() => {
    if (isPlacing) {
      clearPlacement()
    }
    if (isSelectingPlacedProject) {
      clearPlacedProjectSelection()
    }
  }, [clearPlacedProjectSelection, clearPlacement, isPlacing, isSelectingPlacedProject])

  const handleSelectUnplacedProject = useCallback(
    (projectId: string) => {
      if (onPlaceProject) {
        startPlacement(projectId)
        setIsPanelCollapsed(false)
        return
      }
      onSelectUnplacedProject?.(projectId)
    },
    [onPlaceProject, onSelectUnplacedProject, startPlacement]
  )

  const handleSelectUnplacedSystem = useCallback(
    (systemId: string) => {
      if (onPlaceSystem) {
        startSystemPlacement(systemId)
        setIsPanelCollapsed(false)
        return
      }
      onOpenSystem?.(systemId)
    },
    [onPlaceSystem, onOpenSystem, startSystemPlacement]
  )

  const handleStartSelectingPlacedProject = useCallback(() => {
    startSelectingPlacedProject()
    setIsPanelCollapsed(false)
  }, [startSelectingPlacedProject])

  const handleRemoveSelectedPlacedProject = useCallback(() => {
    if (!selectedPlacedProjectId || !onRemovePlacedProject) {
      return
    }

    void Promise.resolve(onRemovePlacedProject(selectedPlacedProjectId))
      .then(() => {
        clearPlacedProjectSelection()
      })
      .catch(error => {
        console.error('Failed to remove project from map', error)
      })
  }, [clearPlacedProjectSelection, onRemovePlacedProject, selectedPlacedProjectId])

  return (
    <div className='relative h-full w-full'>
      {showFirstPlacementPrompt && (unplacedProjects.length > 0 || unplacedSystems.length > 0) && (
        <div className='pointer-events-auto absolute left-4 top-4 z-[6] max-w-[320px] rounded-lg border border-[#d8cab3] bg-[#fff8ec]/95 p-3 shadow-sm backdrop-blur-sm'>
          <p className='text-xs font-semibold text-[#2f2b27]'>
            Your projects and systems are ready to place
          </p>
          <p className='mt-1 text-xs text-[#7f6952]'>
            Select an unplaced item, then click an empty highlighted hex to put it on the map.
          </p>
          <button
            type='button'
            className='mt-2 rounded border border-[#d8cab3] bg-white px-2 py-1 text-[10px] font-semibold text-[#7f6952]'
            onClick={dismissFirstPlacementPrompt}
          >
            Dismiss
          </button>
        </div>
      )}

      <Canvas
        orthographic
        camera={{ position: [0, 40, 35], zoom: 1, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        onPointerMissed={handlePointerMissed}
      >
        <color attach='background' args={['#efe2cd']} />

        {/* Warm, soft lighting based on prototype values. */}
        <ambientLight color='#fff5e6' intensity={0.7} />
        <directionalLight position={[10, 20, 10]} color='#ffe8cc' intensity={0.6} />
        <hemisphereLight color='#c9dde6' groundColor='#d4b896' intensity={0.4} />

        <Suspense fallback={null}>
          <CameraRig />
          <HexGrid
            tiles={tiles}
            systemTiles={systemTiles}
            placementProject={
              selectedPlacementProject
                ? { id: selectedPlacementProject.id, name: selectedPlacementProject.name }
                : null
            }
            placementSystem={
              selectedPlacementSystem
                ? { id: selectedPlacementSystem.id, name: selectedPlacementSystem.name }
                : null
            }
            selectedPlacedProjectId={selectedPlacedProjectId}
            isSelectingPlacedProject={isSelectingPlacedProject}
            onPlaceProject={onPlaceProject}
            onPlaceSystem={onPlaceSystem}
            onSelectPlacedProject={selectPlacedProject}
            onCancelPlacement={clearPlacement}
          />
        </Suspense>
      </Canvas>

      <UnplacedPanel
        isCollapsed={isPanelCollapsed}
        unplacedProjects={unplacedProjects}
        unplacedSystems={unplacedSystems}
        completedProjects={completedProjects}
        archivedProjects={archivedProjects}
        onToggleCollapsed={() => setIsPanelCollapsed(collapsed => !collapsed)}
        onSelectUnplacedProject={handleSelectUnplacedProject}
        onSelectUnplacedSystem={handleSelectUnplacedSystem}
        onOpenProject={onOpenProject}
        onUnarchiveProject={onUnarchiveProject}
        placementProject={selectedPlacementProject}
        placementSystem={selectedPlacementSystem}
        selectedPlacedProject={selectedPlacedProject}
        isSelectingPlacedProject={isSelectingPlacedProject}
        onCancelPlacement={clearPlacement}
        onStartSelectingPlacedProject={
          onRemovePlacedProject ? handleStartSelectingPlacedProject : undefined
        }
        onClearPlacedProjectSelection={clearPlacedProjectSelection}
        onRemoveSelectedPlacedProject={
          onRemovePlacedProject ? handleRemoveSelectedPlacedProject : undefined
        }
      />
    </div>
  )
}

export const HexMap: React.FC<HexMapProps> = props => {
  return (
    <PlacementProvider>
      <HexMapSurface {...props} />
    </PlacementProvider>
  )
}
