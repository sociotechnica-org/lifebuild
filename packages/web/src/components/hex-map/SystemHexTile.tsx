import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MeshStandardMaterial } from 'three'
import { truncateLabel } from './labelUtils.js'

const BASE_HEX_SIZE = 1
const TILE_RADIUS = 0.68
const TILE_HEIGHT = 0.22
const TILE_LIFT = 0.24
const HOVER_LIFT = 0.04
const MAX_LABEL_LENGTH = 24
const INNER_TOP_RADIUS = TILE_RADIUS * 0.82
const INNER_TOP_HEIGHT = 0.035

const HEALTH_DOT_RADIUS = 0.03
const HEALTH_DOT_COUNT = 3
const HEALTH_DOT_SPACING = 0.1
const HEALTH_DOT_COLOR = '#4ade80'

const DESATURATION_TARGET = '#9d968d'
const DESATURATION_WEIGHT = 0.3
const HIBERNATING_OPACITY = 0.55

const SEPIA_TARGET = '#b5a99a'
const SEPIA_WEIGHT = 0.4
const CANDLE_EMISSIVE = '#e8a954'
const CANDLE_BASE_INTENSITY = 0.06
const CANDLE_AMPLITUDE = 0.08

/**
 * Helper component that runs a useFrame loop for the candle-flicker effect.
 * Rendered only when isOverdue is true so the frame loop is inactive otherwise.
 */
const CandleFlicker: React.FC<{
  materialRef: React.RefObject<MeshStandardMaterial | null>
}> = ({ materialRef }) => {
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.emissiveIntensity =
        CANDLE_BASE_INTENSITY + Math.sin(clock.elapsedTime * Math.PI) * CANDLE_AMPLITUDE
    }
  })
  return null
}

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

export type SystemHexTileProps = {
  coord: HexCoord
  systemName: string
  categoryColor: string
  lifecycleState: 'planted' | 'hibernating'
  isSelected?: boolean
  isStale?: boolean
  isOverdue?: boolean
  onClick?: () => void
}

export function SystemHexTile({
  coord,
  systemName,
  categoryColor,
  lifecycleState,
  isSelected = false,
  isStale = false,
  isOverdue = false,
  onClick,
}: SystemHexTileProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, BASE_HEX_SIZE), [coord.q, coord.r, coord.s])
  const isHibernating = lifecycleState === 'hibernating'
  const canClick = typeof onClick === 'function'
  const isHoverEnabled = canClick
  const isHighlighted = (isHoverEnabled && isHovered) || isSelected
  const label = useMemo(() => truncateLabel(systemName, MAX_LABEL_LENGTH), [systemName])

  const topCapRef = useRef<MeshStandardMaterial>(null)

  /** Apply sepia tint when stale by mixing toward sepia target at 40% weight. */
  const sepia = (color: string): string =>
    isStale ? mixHexColors(color, SEPIA_TARGET, SEPIA_WEIGHT) : color

  // Desaturated base color: mix category color toward #9d968d by 30%
  const desaturatedBaseColor = useMemo(
    () => mixHexColors(categoryColor, DESATURATION_TARGET, DESATURATION_WEIGHT),
    [categoryColor]
  )

  // For hibernating systems, apply additional desaturation; apply sepia if stale
  const edgeColor = useMemo(() => {
    let base = desaturatedBaseColor
    if (isHibernating) {
      base = mixHexColors(base, DESATURATION_TARGET, 0.3)
    }
    return isStale ? mixHexColors(base, SEPIA_TARGET, SEPIA_WEIGHT) : base
  }, [desaturatedBaseColor, isHibernating, isStale])

  // Category-colored border glow, or candle emissive when overdue
  const emissiveColor = isOverdue ? CANDLE_EMISSIVE : categoryColor
  const emissiveIntensity = isOverdue ? CANDLE_BASE_INTENSITY : isHighlighted ? 0.2 : 0.08

  const innerTopColor = sepia(isHibernating ? '#ddd5ca' : isHighlighted ? '#f0ebe2' : '#e8e0d4')
  const bottomCapColor = sepia(isHibernating ? '#c6c0b7' : '#ddd4c6')

  const groupOpacity = isHibernating ? HIBERNATING_OPACITY : 1

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  // Health dot positions: centered row of 3 dots below the name area
  const healthDotPositions = useMemo(() => {
    const totalWidth = (HEALTH_DOT_COUNT - 1) * HEALTH_DOT_SPACING
    const startX = -totalWidth / 2
    return Array.from(
      { length: HEALTH_DOT_COUNT },
      (_, index) => startX + index * HEALTH_DOT_SPACING
    )
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
          color={edgeColor}
          roughness={0.62}
          metalness={0.12}
          transparent={isHibernating}
          opacity={groupOpacity}
        />
        {/* material-1 = top cap (category ring base with emissive glow) */}
        <meshStandardMaterial
          ref={topCapRef}
          attach='material-1'
          color={edgeColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.9}
          metalness={0.03}
          transparent={isHibernating}
          opacity={groupOpacity}
        />
        {/* material-2 = bottom cap */}
        <meshStandardMaterial
          attach='material-2'
          color={bottomCapColor}
          roughness={0.85}
          metalness={0.02}
          transparent={isHibernating}
          opacity={groupOpacity}
        />

        {/* Inner top disk leaves a visible category ring around the edge */}
        <mesh position={[0, TILE_HEIGHT / 2 + INNER_TOP_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[INNER_TOP_RADIUS, INNER_TOP_RADIUS, INNER_TOP_HEIGHT, 6]} />
          <meshStandardMaterial
            color={innerTopColor}
            emissive={categoryColor}
            emissiveIntensity={0.04}
            roughness={0.9}
            metalness={0.03}
            transparent={isHibernating}
            opacity={groupOpacity}
          />
        </mesh>
      </mesh>

      {/* Loop icon (infinity symbol) instead of initials */}
      <Text
        raycast={() => null}
        position={[0, TILE_HEIGHT / 2 + 0.12, 0.16]}
        rotation={[-0.52, 0, 0]}
        fontSize={0.32}
        textAlign='center'
        color={isHibernating ? '#6f6a62' : '#ffffff'}
        anchorX='center'
        anchorY='middle'
        outlineWidth={0.03}
        outlineColor={isHibernating ? '#d4cec4' : '#3d2e1e'}
      >
        {'\u221E'}
      </Text>

      {/* Health dots: 3 small filled dots below the infinity symbol */}
      {healthDotPositions.map((dotX, index) => (
        <mesh key={index} position={[dotX, TILE_HEIGHT / 2 + 0.04, 0.3]} rotation={[-0.52, 0, 0]}>
          <circleGeometry args={[HEALTH_DOT_RADIUS, 16]} />
          <meshStandardMaterial
            color={isHibernating ? '#8b8680' : HEALTH_DOT_COLOR}
            transparent={isHibernating}
            opacity={isHibernating ? 0.5 : 1}
          />
        </mesh>
      ))}

      {/* Hover label */}
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

      {isOverdue && <CandleFlicker materialRef={topCapRef} />}
    </group>
  )
}
