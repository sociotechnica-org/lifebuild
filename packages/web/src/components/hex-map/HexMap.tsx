import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToKey } from '@lifebuild/shared/hex'
import { getHexPlacements$, getProjects$ } from '@lifebuild/shared/queries'
import { getCategoryInfo, type ProjectCategory } from '@lifebuild/shared'
import { Canvas } from '@react-three/fiber'
import React, { Suspense, useMemo } from 'react'
import { useQuery } from '../../livestore-compat.js'
import { CameraRig } from './CameraRig.js'
import type { HexCellProjectData } from './HexCell.js'
import { HexGrid } from './HexGrid.js'

export type HexMapProps = {
  onHexClick?: (projectId: string) => void
  placementMode?: {
    projectId: string
    onPlace: (coord: HexCoord) => void
  }
}

export const HexMap: React.FC<HexMapProps> = ({ onHexClick, placementMode }) => {
  const placements = useQuery(getHexPlacements$) ?? []
  const projects = useQuery(getProjects$) ?? []

  const hexProjectMap = useMemo(() => {
    const map = new Map<string, HexCellProjectData>()
    const projectMap = new Map(projects.map(p => [p.id, p]))

    for (const placement of placements) {
      const project = projectMap.get(placement.projectId)
      if (!project) continue
      const key = hexToKey({ q: placement.q, r: placement.r, s: placement.s })
      const info = getCategoryInfo(project.category as ProjectCategory | null)
      map.set(key, {
        id: project.id,
        name: project.name,
        categoryColor: info?.colorHex ?? '#8b8680',
      })
    }

    return map
  }, [placements, projects])

  return (
    <div className='h-full w-full'>
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
          <HexGrid
            hexProjectMap={hexProjectMap}
            onHexClick={onHexClick}
            placementMode={placementMode}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
