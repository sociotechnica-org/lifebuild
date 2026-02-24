import { Text } from '@react-three/drei'
import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { getInitials } from '../../utils/initials.js'
import { truncateLabel } from './labelUtils.js'

const BASE_HEX_SIZE = 1
const TILE_RADIUS = 0.68
const TILE_HEIGHT = 0.22
const TILE_LIFT = 0.24
const HOVER_LIFT = 0.04
const MAX_LABEL_LENGTH = 24
const INNER_TOP_RADIUS = TILE_RADIUS * 0.82
const INNER_TOP_HEIGHT = 0.035

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const parseHexColor = (color: string): [number, number, number] => {
  const normalized = color.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return [139, 134, 128]
  }

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  return [red, green, blue]
}

const toHexColor = ([red, green, blue]: [number, number, number]): string => {
  return `#${[red, green, blue]
    .map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

const mixHexColors = (base: string, target: string, weight: number): string => {
  const ratio = clamp(weight, 0, 1)
  const [baseR, baseG, baseB] = parseHexColor(base)
  const [targetR, targetG, targetB] = parseHexColor(target)

  return toHexColor([
    baseR + (targetR - baseR) * ratio,
    baseG + (targetG - baseG) * ratio,
    baseB + (targetB - baseB) * ratio,
  ])
}

const STREAM_GLOW_COLORS = {
  gold: '#d8a650',
  silver: '#c5ced8',
  bronze: '#c48b5a',
} as const

export type HexTileVisualState = 'planning' | 'active' | 'work-at-hand' | 'completed'
export type HexTileWorkstream = 'gold' | 'silver' | 'bronze' | null

type HexTileProps = {
  coord: HexCoord
  projectName: string
  categoryColor: string
  visualState?: HexTileVisualState
  workstream?: HexTileWorkstream
  isCompleted?: boolean
  isSelected?: boolean
  allowCompletedClick?: boolean
  onClick?: () => void
}

export function HexTile({
  coord,
  projectName,
  categoryColor,
  visualState,
  workstream = null,
  isCompleted = false,
  isSelected = false,
  allowCompletedClick = false,
  onClick,
}: HexTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, BASE_HEX_SIZE), [coord.q, coord.r, coord.s])
  const resolvedVisualState = visualState ?? (isCompleted ? 'completed' : 'active')
  const isCompletedState = resolvedVisualState === 'completed'
  const canClick = typeof onClick === 'function' && (!isCompletedState || allowCompletedClick)
  const isHoverEnabled = canClick && !isCompletedState
  const isHighlighted = (isHoverEnabled && isHovered) || isSelected
  const label = useMemo(() => truncateLabel(projectName, MAX_LABEL_LENGTH), [projectName])
  const initials = useMemo(() => getInitials(projectName), [projectName])

  const categoryEdgeColor = useMemo(() => {
    if (isCompletedState) {
      return '#a7a29a'
    }
    if (resolvedVisualState === 'planning') {
      return mixHexColors(categoryColor, '#9d968d', 0.4)
    }
    return categoryColor
  }, [categoryColor, isCompletedState, resolvedVisualState])

  const streamGlowColor =
    resolvedVisualState === 'work-at-hand' ? STREAM_GLOW_COLORS[workstream ?? 'bronze'] : null

  const emissiveColor = streamGlowColor ?? (isHighlighted ? '#6e5a45' : '#000000')
  const emissiveIntensity = streamGlowColor
    ? isHighlighted
      ? 0.26
      : 0.2
    : isHovered
      ? 0.12
      : isSelected
        ? 0.18
        : 0
  const innerTopColor = isCompletedState ? '#ddd5ca' : isHighlighted ? '#fff2e2' : '#f5ead6'

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  return (
    <group
      position={[
        x,
        TILE_LIFT + (isHoverEnabled && isHovered ? HOVER_LIFT : 0) + (isSelected ? 0.02 : 0),
        z,
      ]}
      onClick={event => {
        if (!canClick) {
          return
        }
        event.stopPropagation()
        onClick?.()
      }}
      onPointerOver={event => {
        event.stopPropagation()
        document.body.style.cursor = canClick ? 'pointer' : 'default'
        if (isHoverEnabled) {
          setIsHovered(true)
        }
      }}
      onPointerOut={event => {
        event.stopPropagation()
        setIsHovered(false)
        document.body.style.cursor = 'default'
      }}
    >
      <mesh>
        <cylinderGeometry args={[TILE_RADIUS, TILE_RADIUS, TILE_HEIGHT, 6]} />
        {/* material-0 = side faces (tube) */}
        <meshStandardMaterial
          attach='material-0'
          color={categoryEdgeColor}
          roughness={0.62}
          metalness={0.12}
        />
        {/* material-1 = top cap (category ring base) */}
        <meshStandardMaterial
          attach='material-1'
          color={categoryEdgeColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.9}
          metalness={0.03}
        />
        {/* material-2 = bottom cap */}
        <meshStandardMaterial
          attach='material-2'
          color={isCompletedState ? '#c6c0b7' : '#e7d8c2'}
          roughness={0.85}
          metalness={0.02}
        />

        {/* Inner top disk leaves a visible category ring around the edge. */}
        <mesh position={[0, TILE_HEIGHT / 2 + INNER_TOP_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[INNER_TOP_RADIUS, INNER_TOP_RADIUS, INNER_TOP_HEIGHT, 6]} />
          <meshStandardMaterial
            color={innerTopColor}
            emissive={streamGlowColor ?? '#000000'}
            emissiveIntensity={streamGlowColor ? 0.08 : 0}
            roughness={0.9}
            metalness={0.03}
          />
        </mesh>
      </mesh>

      <Text
        raycast={() => null}
        position={[0, TILE_HEIGHT / 2 + 0.12, 0.16]}
        rotation={[-0.52, 0, 0]}
        fontSize={0.34}
        textAlign='center'
        color={isCompletedState ? '#6f6a62' : '#ffffff'}
        anchorX='center'
        anchorY='middle'
        outlineWidth={0.03}
        outlineColor={isCompletedState ? '#d4cec4' : '#3d2e1e'}
      >
        {initials}
      </Text>

      {isHoverEnabled && isHovered && (
        <Text
          raycast={() => null}
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
