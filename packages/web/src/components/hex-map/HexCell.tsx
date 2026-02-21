import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'

const HEX_SIZE = 1
const HEX_HEIGHT = 0.22
const HOVER_LIFT = 0.03
// Slight overlap hides subpixel seams between neighboring meshes.
const HEX_JOIN_SCALE = 1.002

export type HexCellVisualState = 'default' | 'hover'

type HexCellProps = {
  coord: HexCoord
  visualStateOverride?: HexCellVisualState
}

export function HexCell({ coord, visualStateOverride }: HexCellProps) {
  const [isPointerHovering, setIsPointerHovering] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, HEX_SIZE), [coord.q, coord.r, coord.s])
  const visualState = visualStateOverride ?? (isPointerHovering ? 'hover' : 'default')
  const isHovered = visualState === 'hover'

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  return (
    <mesh
      position={[x, HEX_HEIGHT / 2 + (isHovered ? HOVER_LIFT : 0), z]}
      scale={[HEX_JOIN_SCALE, 1, HEX_JOIN_SCALE]}
      onPointerOver={event => {
        event.stopPropagation()
        setIsPointerHovering(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setIsPointerHovering(false)
        document.body.style.cursor = 'default'
      }}
    >
      <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, HEX_HEIGHT, 6]} />
      <meshStandardMaterial
        attach='material-0'
        color={isHovered ? '#b89b7d' : '#ab8f72'}
        roughness={0.94}
        metalness={0.04}
      />
      <meshStandardMaterial
        attach='material-1'
        color={isHovered ? '#f0e2c8' : '#e2d2b6'}
        emissive={isHovered ? '#8d6c4f' : '#000000'}
        emissiveIntensity={isHovered ? 0.15 : 0}
        roughness={0.88}
        metalness={0.03}
      />
      <meshStandardMaterial
        attach='material-2'
        color={isHovered ? '#dcc8a8' : '#cfb693'}
        roughness={0.91}
        metalness={0.02}
      />
    </mesh>
  )
}
