import { Html } from '@react-three/drei'
import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'

const BASE_HEX_SIZE = 1
const TILE_RADIUS = 0.68
const TILE_HEIGHT = 0.16
const TILE_LIFT = 0.14
const HOVER_LIFT = 0.04
const MAX_LABEL_LENGTH = 24

type HexTileProps = {
  coord: HexCoord
  projectName: string
  categoryColor: string
  isCompleted?: boolean
  onClick?: () => void
}

const truncateLabel = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 3)}...`
}

export function HexTile({
  coord,
  projectName,
  categoryColor,
  isCompleted = false,
  onClick,
}: HexTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, BASE_HEX_SIZE), [coord.q, coord.r, coord.s])
  const canInteract = !isCompleted && typeof onClick === 'function'
  const label = useMemo(() => truncateLabel(projectName, MAX_LABEL_LENGTH), [projectName])

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  return (
    <group position={[x, TILE_LIFT + (isHovered ? HOVER_LIFT : 0), z]}>
      <mesh
        onClick={event => {
          if (!canInteract) {
            return
          }
          event.stopPropagation()
          onClick?.()
        }}
        onPointerOver={event => {
          event.stopPropagation()
          if (!canInteract) {
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
        <meshStandardMaterial
          attach='material-0'
          color={isCompleted ? '#a7a29a' : categoryColor}
          roughness={0.8}
          metalness={0.06}
        />
        <meshStandardMaterial
          attach='material-1'
          color={isCompleted ? '#d4cec4' : categoryColor}
          emissive={isHovered ? '#6e5a45' : '#000000'}
          emissiveIntensity={isHovered ? 0.12 : 0}
          roughness={0.74}
          metalness={0.05}
        />
        <meshStandardMaterial
          attach='material-2'
          color={isCompleted ? '#c6c0b7' : categoryColor}
          roughness={0.78}
          metalness={0.04}
        />
      </mesh>

      <Html position={[0, TILE_HEIGHT / 2 + 0.05, 0]} center style={{ pointerEvents: 'none' }}>
        <div
          className={`max-w-[140px] rounded-md px-2 py-1 text-center text-[11px] font-semibold shadow-sm ${
            isCompleted
              ? 'bg-[#f0ece5]/95 text-[#6f6a62]'
              : 'bg-[#faf4e9]/95 text-[#2f2b27] backdrop-blur-[2px]'
          }`}
          title={projectName}
        >
          {label}
        </div>
      </Html>
    </group>
  )
}
