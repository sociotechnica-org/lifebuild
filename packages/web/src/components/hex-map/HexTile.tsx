import { Text } from '@react-three/drei'
import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { truncateLabel } from './labelUtils.js'

const BASE_HEX_SIZE = 1
const TILE_RADIUS = 0.68
const TILE_HEIGHT = 0.22
const TILE_LIFT = 0.24
const HOVER_LIFT = 0.04
const MAX_LABEL_LENGTH = 24

const getInitials = (value: string): string => {
  const words = value.trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    return `${words[0]?.[0] ?? ''}${words[1]?.[0] ?? ''}`.toUpperCase()
  }
  return value.slice(0, 2).toUpperCase()
}

type HexTileProps = {
  coord: HexCoord
  projectName: string
  categoryColor: string
  isCompleted?: boolean
  isSelected?: boolean
  allowCompletedClick?: boolean
  onClick?: () => void
}

export function HexTile({
  coord,
  projectName,
  categoryColor,
  isCompleted = false,
  isSelected = false,
  allowCompletedClick = false,
  onClick,
}: HexTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, BASE_HEX_SIZE), [coord.q, coord.r, coord.s])
  const canClick = typeof onClick === 'function' && (!isCompleted || allowCompletedClick)
  const canHover = canClick
  const isHighlighted = isHovered || isSelected
  const label = useMemo(() => truncateLabel(projectName, MAX_LABEL_LENGTH), [projectName])
  const initials = useMemo(() => getInitials(projectName), [projectName])

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  return (
    <group position={[x, TILE_LIFT + (isHovered ? HOVER_LIFT : 0) + (isSelected ? 0.02 : 0), z]}>
      <mesh
        onClick={event => {
          if (!canClick) {
            return
          }
          event.stopPropagation()
          onClick?.()
        }}
        onPointerOver={event => {
          event.stopPropagation()
          if (!canHover) {
            return
          }
          setIsHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setIsHovered(false)
          document.body.style.cursor = 'default'
        }}
      >
        <cylinderGeometry args={[TILE_RADIUS, TILE_RADIUS, TILE_HEIGHT, 6]} />
        {/* material-0 = side faces (tube) */}
        <meshStandardMaterial
          attach='material-0'
          color={isCompleted ? '#a7a29a' : categoryColor}
          roughness={0.62}
          metalness={0.12}
        />
        {/* material-1 = top cap */}
        <meshStandardMaterial
          attach='material-1'
          color={isCompleted ? '#d4cec4' : isHighlighted ? '#faf4e8' : '#f5ead6'}
          emissive={isHighlighted ? '#6e5a45' : '#000000'}
          emissiveIntensity={isHovered ? 0.12 : isSelected ? 0.18 : 0}
          roughness={0.9}
          metalness={0.03}
        />
        {/* material-2 = bottom cap */}
        <meshStandardMaterial
          attach='material-2'
          color={isCompleted ? '#c6c0b7' : '#e7d8c2'}
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>

      <Text
        position={[0, TILE_HEIGHT / 2 + 0.12, 0.16]}
        rotation={[-0.52, 0, 0]}
        fontSize={0.34}
        textAlign='center'
        color={isCompleted ? '#6f6a62' : '#ffffff'}
        anchorX='center'
        anchorY='middle'
        outlineWidth={0.03}
        outlineColor={isCompleted ? '#d4cec4' : '#3d2e1e'}
      >
        {initials}
      </Text>

      {isHovered && (
        <Text
          position={[0, TILE_HEIGHT / 2 + 0.42, 0.02]}
          rotation={[-0.52, 0, 0]}
          fontSize={0.22}
          maxWidth={2.2}
          textAlign='center'
          color='#ffffff'
          anchorX='center'
          anchorY='middle'
          outlineWidth={0.04}
          outlineColor='#2a1f14'
          lineHeight={1.1}
        >
          {label}
        </Text>
      )}
    </group>
  )
}
