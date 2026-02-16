import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { hexToWorld } from '../hex/math.js'
import type { HexCoord } from '../hex/types.js'
import { createParchmentMaterial } from '../shaders/parchmentShader.js'
import { createKubelkaMunkMaterial } from '../shaders/kubelkaMunkShader.js'
import { useShaderParams } from '../store/shaderParams.js'
import { useKMParams, useShaderMode } from '../store/kmParams.js'

const HEX_SIZE = 1.0
const HEX_HEIGHT = 0.15

// CylinderGeometry with 6 segments places a vertex at +Z by default,
// which is already pointy-top for our hex grid. No rotation needed.

interface HexCellProps {
  coord: HexCoord
  isSelected: boolean
  hasUnit: boolean
  onClick: (coord: HexCoord) => void
}

// Highlight configs: [r, g, b, strength]
const HIGHLIGHT_NONE: [number, number, number, number] = [0, 0, 0, 0]
const HIGHLIGHT_HOVER: [number, number, number, number] = [0.83, 0.77, 0.63, 0.25]
const HIGHLIGHT_SELECTED: [number, number, number, number] = [0.48, 0.65, 0.64, 0.35]
const HIGHLIGHT_UNIT: [number, number, number, number] = [0.72, 0.64, 0.45, 0.15]

export function HexCell({ coord, isSelected, hasUnit, onClick }: HexCellProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const [x, z] = hexToWorld(coord, HEX_SIZE)

  const parchmentMat = useMemo(() => createParchmentMaterial(), [])
  const kmMat = useMemo(() => createKubelkaMunkMaterial(), [])

  const mode = useShaderMode(s => s.mode)
  const parchmentParams = useShaderParams()
  const kmParams = useKMParams()

  const material = mode === 'parchment' ? parchmentMat : kmMat

  // Determine highlight based on state
  let highlight = HIGHLIGHT_NONE
  if (isSelected) highlight = HIGHLIGHT_SELECTED
  else if (hasUnit) highlight = HIGHLIGHT_UNIT
  else if (hovered) highlight = HIGHLIGHT_HOVER

  // Update uniforms based on active shader
  const u = material.uniforms
  u.uHighlight.value.set(highlight[0], highlight[1], highlight[2])
  u.uHighlightStrength.value = highlight[3]
  u.uEdgeStrength.value = mode === 'parchment' ? parchmentParams.edgeStrength : kmParams.edgeStrength
  u.uEdgeWidth.value = mode === 'parchment' ? parchmentParams.edgeWidth : kmParams.edgeWidth

  if (mode === 'parchment') {
    const p = parchmentParams
    u.uRegionScale.value = p.regionScale
    u.uRegion2Scale.value = p.region2Scale
    u.uBlotchScale.value = p.blotchScale
    u.uBlotch2Scale.value = p.blotch2Scale
    u.uWetEdgeScale.value = p.wetEdgeScale
    u.uGrainScale.value = p.grainScale
    u.uFiberScaleX.value = p.fiberScaleX
    u.uFiberScaleY.value = p.fiberScaleY
    u.uSpeckleScale.value = p.speckleScale
    u.uSageStrength.value = p.sageStrength
    u.uStainStrength.value = p.stainStrength
    u.uPoolLightStrength.value = p.poolLightStrength
    u.uPoolDarkStrength.value = p.poolDarkStrength
    u.uWetEdgeStrength.value = p.wetEdgeStrength
    u.uGrainIntensity.value = p.grainIntensity
    u.uFiberIntensity.value = p.fiberIntensity
    u.uSpeckleIntensity.value = p.speckleIntensity
  } else {
    const k = kmParams
    u.uBaseThickness.value = k.baseThickness
    u.uThicknessVariation.value = k.thicknessVariation
    u.uOchreAmount.value = k.ochreAmount
    u.uSiennaAmount.value = k.siennaAmount
    u.uGreenAmount.value = k.greenAmount
    u.uUmberAmount.value = k.umberAmount
    u.uRegionScale.value = k.regionScale
    u.uBlotchScale.value = k.blotchScale
    u.uGrainScale.value = k.grainScale
    u.uGrainIntensity.value = k.grainIntensity
    u.uEdgeDarkening.value = k.edgeDarkening
  }

  return (
    <group position={[x, 0, z]}>
      <mesh
        ref={meshRef}
        onClick={e => {
          e.stopPropagation()
          onClick(coord)
        }}
        onPointerOver={e => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'default'
        }}
        material={material}
      >
        <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, HEX_HEIGHT, 6]} />
      </mesh>
    </group>
  )
}
