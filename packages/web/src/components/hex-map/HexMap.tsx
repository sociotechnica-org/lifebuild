import { Canvas } from '@react-three/fiber'
import React, { Suspense } from 'react'
import { useState } from 'react'
import { CameraRig } from './CameraRig.js'
import { HexGrid, type PlacedHexTile } from './HexGrid.js'
import {
  UnplacedPanel,
  type PanelArchivedProjectItem,
  type PanelCompletedProjectItem,
  type PanelProjectItem,
} from './UnplacedPanel.js'

type HexMapProps = {
  tiles?: readonly PlacedHexTile[]
  unplacedProjects?: readonly PanelProjectItem[]
  completedProjects?: readonly PanelCompletedProjectItem[]
  archivedProjects?: readonly PanelArchivedProjectItem[]
  onOpenProject?: (projectId: string) => void
  onUnarchiveProject?: (projectId: string) => void
}

export const HexMap: React.FC<HexMapProps> = ({
  tiles = [],
  unplacedProjects = [],
  completedProjects = [],
  archivedProjects = [],
  onOpenProject,
  onUnarchiveProject,
}) => {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false)

  return (
    <div className='relative h-full w-full'>
      <Canvas
        orthographic
        camera={{ position: [0, 40, 35], zoom: 1, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach='background' args={['#efe2cd']} />

        {/* Warm, soft lighting based on prototype values. */}
        <ambientLight color='#fff5e6' intensity={0.7} />
        <directionalLight position={[10, 20, 10]} color='#ffe8cc' intensity={0.6} />
        <hemisphereLight color='#c9dde6' groundColor='#d4b896' intensity={0.4} />

        <Suspense fallback={null}>
          <CameraRig />
          <HexGrid tiles={tiles} />
        </Suspense>
      </Canvas>

      <UnplacedPanel
        isCollapsed={isPanelCollapsed}
        unplacedProjects={unplacedProjects}
        completedProjects={completedProjects}
        archivedProjects={archivedProjects}
        onToggleCollapsed={() => setIsPanelCollapsed(collapsed => !collapsed)}
        onOpenProject={onOpenProject}
        onUnarchiveProject={onUnarchiveProject}
      />
    </div>
  )
}
