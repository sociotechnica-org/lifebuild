import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import { Text } from '@react-three/drei'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'

const HEX_SIZE = 1
const HEX_HEIGHT = 0.22
const OCCUPIED_HEIGHT = 0.5
const HOVER_LIFT = 0.03
// Slight overlap hides subpixel seams between neighboring meshes.
const HEX_JOIN_SCALE = 1.002

export type HexCellVisualState = 'default' | 'hover' | 'occupied' | 'placement-target'

export type HexCellProjectData = {
  id: string
  name: string
  categoryColor: string
}

type HexCellProps = {
  coord: HexCoord
  visualStateOverride?: HexCellVisualState
  projectData?: HexCellProjectData
  onClick?: () => void
}

// Color palettes per visual state
const COLORS = {
  default: {
    top: '#ab8f72',
    bottom: '#e2d2b6',
    side: '#cfb693',
  },
  hover: {
    top: '#b89b7d',
    bottom: '#f0e2c8',
    side: '#dcc8a8',
  },
  occupied: {
    top: '#f5ead6',
    bottom: '#f0e2c8',
    side: '#cfb693', // overridden by projectData.categoryColor when available
  },
  'placement-target': {
    top: '#c8b89a',
    bottom: '#f5edd8',
    side: '#d8cab3',
  },
} as const

// Extract initials from a project name (max 2 characters)
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function HexCell({ coord, visualStateOverride, projectData, onClick }: HexCellProps) {
  const [isPointerHovering, setIsPointerHovering] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, HEX_SIZE), [coord.q, coord.r, coord.s])

  const baseState: HexCellVisualState = projectData ? 'occupied' : 'default'
  const visualState = visualStateOverride ?? (isPointerHovering ? 'hover' : baseState)
  const isHovered = visualState === 'hover' || (isPointerHovering && visualState !== 'default')
  const isOccupied = visualState === 'occupied' || (projectData != null && visualState === 'hover')
  const isPlacementTarget = visualState === 'placement-target'

  const colors = isHovered ? COLORS.hover : (COLORS[visualState] ?? COLORS.default)
  const sideColor = isOccupied && projectData ? projectData.categoryColor : colors.side
  // Lighten top face for occupied tiles — keeps category color on the sides as the primary accent
  const topColor = isOccupied && projectData ? (isHovered ? '#faf4ea' : '#f5ead6') : colors.top

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  const isClickable = onClick != null || projectData != null

  const height = isOccupied ? OCCUPIED_HEIGHT : HEX_HEIGHT

  return (
    <group position={[x, 0, z]}>
      <mesh
        position={[0, height / 2 + (isHovered ? HOVER_LIFT : 0), 0]}
        scale={[HEX_JOIN_SCALE, 1, HEX_JOIN_SCALE]}
        onPointerOver={event => {
          event.stopPropagation()
          setIsPointerHovering(true)
          if (isClickable) {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          setIsPointerHovering(false)
          document.body.style.cursor = 'default'
        }}
        onClick={
          onClick
            ? event => {
                event.stopPropagation()
                onClick()
              }
            : undefined
        }
      >
        <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, height, 6]} />
        {/* material-0 = side faces (tube) — category color for occupied tiles */}
        <meshStandardMaterial
          attach='material-0'
          color={sideColor}
          roughness={isOccupied ? 0.6 : 0.91}
          metalness={isOccupied ? 0.12 : 0.02}
        />
        {/* material-1 = top cap */}
        <meshStandardMaterial
          attach='material-1'
          color={topColor}
          emissive={isHovered ? '#8d6c4f' : isPlacementTarget ? '#a89060' : '#000000'}
          emissiveIntensity={isHovered ? 0.15 : isPlacementTarget ? 0.08 : 0}
          roughness={0.94}
          metalness={0.04}
        />
        {/* material-2 = bottom cap */}
        <meshStandardMaterial
          attach='material-2'
          color={colors.bottom}
          roughness={0.88}
          metalness={0.03}
        />
      </mesh>

      {/* Initials label — compact, always visible */}
      {projectData && (
        <Text
          position={[0, height + 0.22, 0.18]}
          rotation={[-0.52, 0, 0]}
          fontSize={0.38}
          textAlign='center'
          color='#ffffff'
          anchorX='center'
          anchorY='middle'
          outlineWidth={0.035}
          outlineColor='#3d2e1e'
          fontWeight='bold'
        >
          {getInitials(projectData.name)}
        </Text>
      )}

      {/* Hover tooltip — full project name, floats above the tile */}
      {projectData && isPointerHovering && (
        <Text
          position={[0, height + 0.7, 0]}
          rotation={[-0.52, 0, 0]}
          fontSize={0.28}
          maxWidth={2.4}
          textAlign='center'
          color='#ffffff'
          anchorX='center'
          anchorY='middle'
          outlineWidth={0.05}
          outlineColor='#2a1f14'
          lineHeight={1.1}
        >
          {projectData.name}
        </Text>
      )}

      {/* Placement target indicator */}
      {isPlacementTarget && (
        <Text
          position={[0, HEX_HEIGHT + 0.12, 0.2]}
          rotation={[-0.52, 0, 0]}
          fontSize={0.5}
          color='#6f5b44'
          anchorX='center'
          anchorY='middle'
          fillOpacity={0.7}
        >
          +
        </Text>
      )}
    </group>
  )
}
