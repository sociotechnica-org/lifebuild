import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'

const HEX_SIZE = 1
const HEX_HEIGHT = 0.22
const HOVER_LIFT = 0.03
// Slight overlap hides subpixel seams between neighboring meshes.
const HEX_JOIN_SCALE = 1.002

export type HexCellVisualState = 'default' | 'hover' | 'placeable' | 'blocked' | 'targeted'

type HexCellProps = {
  coord: HexCoord
  visualStateOverride?: HexCellVisualState
  onClick?: (coord: HexCoord) => void
  onHoverChange?: (isHovered: boolean) => void
}

export function HexCell({ coord, visualStateOverride, onClick, onHoverChange }: HexCellProps) {
  const [isPointerHovering, setIsPointerHovering] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, HEX_SIZE), [coord.q, coord.r, coord.s])
  const visualState = visualStateOverride ?? (isPointerHovering ? 'hover' : 'default')

  const lift =
    visualState === 'targeted' ? HOVER_LIFT + 0.03 : visualState === 'hover' ? HOVER_LIFT : 0

  const material = useMemo(() => {
    switch (visualState) {
      case 'hover':
        return {
          rim: '#b89b7d',
          top: '#f0e2c8',
          side: '#dcc8a8',
          emissive: '#8d6c4f',
          emissiveIntensity: 0.15,
        }
      case 'placeable':
        return {
          rim: '#c19f7c',
          top: '#f5e6cb',
          side: '#e3cbab',
          emissive: '#9b7048',
          emissiveIntensity: 0.1,
        }
      case 'targeted':
        return {
          rim: '#cf9158',
          top: '#f8dfbb',
          side: '#e8c39b',
          emissive: '#a35c24',
          emissiveIntensity: 0.2,
        }
      case 'blocked':
        return {
          rim: '#8f7d69',
          top: '#d7cab4',
          side: '#b8a58b',
          emissive: '#000000',
          emissiveIntensity: 0,
        }
      default:
        return {
          rim: '#ab8f72',
          top: '#e2d2b6',
          side: '#cfb693',
          emissive: '#000000',
          emissiveIntensity: 0,
        }
    }
  }, [visualState])

  const pointerCursor = useMemo(() => {
    if (visualState === 'blocked') {
      return 'not-allowed'
    }
    if (visualState === 'placeable' || visualState === 'targeted' || onClick) {
      return 'pointer'
    }
    return 'default'
  }, [onClick, visualState])

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  return (
    <mesh
      position={[x, HEX_HEIGHT / 2 + lift, z]}
      scale={[HEX_JOIN_SCALE, 1, HEX_JOIN_SCALE]}
      onPointerOver={event => {
        event.stopPropagation()
        onHoverChange?.(true)
        if (!visualStateOverride) {
          setIsPointerHovering(true)
        }
        document.body.style.cursor = pointerCursor
      }}
      onPointerOut={() => {
        onHoverChange?.(false)
        setIsPointerHovering(false)
        document.body.style.cursor = 'default'
      }}
      onClick={event => {
        event.stopPropagation()
        onClick?.(coord)
      }}
    >
      <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, HEX_HEIGHT, 6]} />
      <meshStandardMaterial
        attach='material-0'
        color={material.rim}
        roughness={0.94}
        metalness={0.04}
      />
      <meshStandardMaterial
        attach='material-1'
        color={material.top}
        emissive={material.emissive}
        emissiveIntensity={material.emissiveIntensity}
        roughness={0.88}
        metalness={0.03}
      />
      <meshStandardMaterial
        attach='material-2'
        color={material.side}
        roughness={0.91}
        metalness={0.02}
      />
    </mesh>
  )
}
