import type { HexCoord } from '@lifebuild/shared/hex'
import { Canvas } from '@react-three/fiber'
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { CameraRig } from './CameraRig.js'
import { HexGrid, type PlacedHexTile } from './HexGrid.js'
import { PlacementProvider, usePlacement } from './PlacementContext.js'
import {
  UnplacedPanel,
  type PanelArchivedProjectItem,
  type PanelCompletedProjectItem,
  type PanelProjectItem,
} from './UnplacedPanel.js'

const FIRST_PLACEMENT_PROMPT_KEY = 'life-map-placement-first-run-dismissed-v1'

const canUseLocalStorage = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

type HexMapProps = {
  tiles?: readonly PlacedHexTile[]
  unplacedProjects?: readonly PanelProjectItem[]
  completedProjects?: readonly PanelCompletedProjectItem[]
  archivedProjects?: readonly PanelArchivedProjectItem[]
  onPlaceProject?: (projectId: string, coord: HexCoord) => Promise<void> | void
  onRemovePlacedProject?: (projectId: string) => Promise<void> | void
  onSelectUnplacedProject?: (projectId: string) => void
  onOpenProject?: (projectId: string) => void
  onUnarchiveProject?: (projectId: string) => void
}

const HexMapSurface: React.FC<HexMapProps> = ({
  tiles = [],
  unplacedProjects = [],
  completedProjects = [],
  archivedProjects = [],
  onPlaceProject,
  onRemovePlacedProject,
  onSelectUnplacedProject,
  onOpenProject,
  onUnarchiveProject,
}) => {
  const {
    placementProjectId,
    selectedPlacedProjectId,
    isSelectingPlacedProject,
    isPlacing,
    startPlacement,
    clearPlacement,
    startSelectingPlacedProject,
    selectPlacedProject,
    clearPlacedProjectSelection,
  } = usePlacement()

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)
  const [showFirstPlacementPrompt, setShowFirstPlacementPrompt] = useState(() => {
    if (unplacedProjects.length === 0) {
      return false
    }
    if (!canUseLocalStorage()) {
      return true
    }
    return window.localStorage.getItem(FIRST_PLACEMENT_PROMPT_KEY) !== '1'
  })

  const unplacedProjectsById = useMemo(() => {
    return new Map(unplacedProjects.map(project => [project.id, project]))
  }, [unplacedProjects])
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
  const selectedPlacedProject = selectedPlacedProjectId
    ? (placedProjectsById.get(selectedPlacedProjectId) ?? null)
    : null

  useEffect(() => {
    if (placementProjectId && !unplacedProjectsById.has(placementProjectId)) {
      clearPlacement()
    }
  }, [clearPlacement, placementProjectId, unplacedProjectsById])

  useEffect(() => {
    if (selectedPlacedProjectId && !placedProjectsById.has(selectedPlacedProjectId)) {
      clearPlacedProjectSelection()
    }
  }, [clearPlacedProjectSelection, placedProjectsById, selectedPlacedProjectId])

  useEffect(() => {
    if (unplacedProjects.length === 0) {
      setShowFirstPlacementPrompt(false)
    }
  }, [unplacedProjects.length])

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
    if (canUseLocalStorage()) {
      window.localStorage.setItem(FIRST_PLACEMENT_PROMPT_KEY, '1')
    }
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
      {showFirstPlacementPrompt && unplacedProjects.length > 0 && (
        <div className='pointer-events-auto absolute left-4 top-4 z-[6] max-w-[320px] rounded-lg border border-[#d8cab3] bg-[#fff8ec]/95 p-3 shadow-sm backdrop-blur-sm'>
          <p className='text-xs font-semibold text-[#2f2b27]'>Your projects are ready to place</p>
          <p className='mt-1 text-xs text-[#7f6952]'>
            Select an unplaced project, then click an empty highlighted hex to put it on the map.
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
            placementProject={
              selectedPlacementProject
                ? { id: selectedPlacementProject.id, name: selectedPlacementProject.name }
                : null
            }
            selectedPlacedProjectId={selectedPlacedProjectId}
            isSelectingPlacedProject={isSelectingPlacedProject}
            onPlaceProject={onPlaceProject}
            onSelectPlacedProject={selectPlacedProject}
            onCancelPlacement={clearPlacement}
          />
        </Suspense>
      </Canvas>

      <UnplacedPanel
        isCollapsed={isPanelCollapsed}
        unplacedProjects={unplacedProjects}
        completedProjects={completedProjects}
        archivedProjects={archivedProjects}
        onToggleCollapsed={() => setIsPanelCollapsed(collapsed => !collapsed)}
        onSelectUnplacedProject={handleSelectUnplacedProject}
        onOpenProject={onOpenProject}
        onUnarchiveProject={onUnarchiveProject}
        placementProject={selectedPlacementProject}
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
