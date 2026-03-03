import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  JESS_PREFERENCE_PARCHMENT_PARAMS,
  applyParchmentUniforms,
  createParchmentMaterial,
} from './shaders/parchmentShader.js'

const HEX_SIZE = 1
const HEX_HEIGHT = 0.22
const HOVER_LIFT = 0.03
// Slight overlap hides subpixel seams between neighboring meshes.
const HEX_JOIN_SCALE = 1.002

export type HexCellVisualState = 'default' | 'hover' | 'placeable' | 'blocked' | 'targeted'

type HexCellProps = {
  coord: HexCoord
  parchmentSeed?: number
  visualStateOverride?: HexCellVisualState
  onClick?: (coord: HexCoord) => void
  onHoverChange?: (isHovered: boolean) => void
}

export function HexCell({
  coord,
  parchmentSeed = 0,
  visualStateOverride,
  onClick,
  onHoverChange,
}: HexCellProps) {
  const [isPointerHovering, setIsPointerHovering] = useState(false)
  const [x, z] = useMemo(() => hexToWorld(coord, HEX_SIZE), [coord.q, coord.r, coord.s])
  const visualState = visualStateOverride ?? (isPointerHovering ? 'hover' : 'default')
  const parchmentMaterial = useMemo(() => createParchmentMaterial(), [])

  const lift =
    visualState === 'targeted' ? HOVER_LIFT + 0.03 : visualState === 'hover' ? HOVER_LIFT : 0

  const material = useMemo(() => {
    switch (visualState) {
      case 'hover':
        return {
          rim: '#b89b7d',
          side: '#dcc8a8',
        }
      case 'placeable':
        return {
          rim: '#c19f7c',
          side: '#e3cbab',
        }
      case 'targeted':
        return {
          rim: '#cf9158',
          side: '#e8c39b',
        }
      case 'blocked':
        return {
          rim: '#8f7d69',
          side: '#b8a58b',
        }
      default:
        return {
          rim: '#ab8f72',
          side: '#cfb693',
        }
    }
  }, [visualState])

  const shaderHighlight = useMemo(() => {
    switch (visualState) {
      case 'hover':
        return { color: '#e7c39a', strength: 0.12 }
      case 'placeable':
        return { color: '#dfb98d', strength: 0.08 }
      case 'targeted':
        return { color: '#de9654', strength: 0.24 }
      case 'blocked':
        return { color: '#918270', strength: 0.2 }
      default:
        return { color: '#000000', strength: 0 }
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
      parchmentMaterial.dispose()
    }
  }, [parchmentMaterial])

  useEffect(() => {
    applyParchmentUniforms(parchmentMaterial, JESS_PREFERENCE_PARCHMENT_PARAMS, {
      seed: parchmentSeed,
      highlightColor: shaderHighlight.color,
      highlightStrength: shaderHighlight.strength,
    })
  }, [parchmentMaterial, parchmentSeed, shaderHighlight.color, shaderHighlight.strength])

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
        attach='material-2'
        color={material.side}
        roughness={0.91}
        metalness={0.02}
      />
      <primitive attach='material-1' object={parchmentMaterial} />
    </mesh>
  )
}
