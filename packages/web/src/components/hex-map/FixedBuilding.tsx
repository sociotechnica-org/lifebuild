import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import { Html, Text } from '@react-three/drei'
import React, { useMemo } from 'react'
import type { FixedBuildingType } from './placementRules.js'

const BASE_HEX_SIZE = 1

const BUILDING_THEME: Record<
  FixedBuildingType,
  { bodyColor: string; roofColor: string; emberColor: string; label: string }
> = {
  campfire: {
    bodyColor: '#7f5a3a',
    roofColor: '#523722',
    emberColor: '#ef9b45',
    label: 'Campfire',
  },
  sanctuary: {
    bodyColor: '#7d8b93',
    roofColor: '#58656d',
    emberColor: '#d9e2e8',
    label: 'Sanctuary',
  },
  workshop: {
    bodyColor: '#9b7959',
    roofColor: '#6e523a',
    emberColor: '#f2c38a',
    label: 'Workshop',
  },
}

type FixedBuildingProps = {
  type: FixedBuildingType
  coord: HexCoord
  onActivate?: () => void
}

export const FixedBuilding: React.FC<FixedBuildingProps> = ({ type, coord, onActivate }) => {
  const [x, z] = useMemo(() => hexToWorld(coord, BASE_HEX_SIZE), [coord.q, coord.r, coord.s])
  const theme = BUILDING_THEME[type]
  const isInteractive = type !== 'campfire' && Boolean(onActivate)

  return (
    <group
      position={[x, 0.28, z]}
      data-testid={`fixed-building-${type}`}
      userData={{ type: 'fixed-building', building: type, coord }}
      onClick={
        isInteractive
          ? event => {
              event.stopPropagation()
              onActivate?.()
            }
          : undefined
      }
    >
      <mesh raycast={() => null}>
        <cylinderGeometry args={[0.52, 0.62, 0.46, 6]} />
        <meshStandardMaterial color={theme.bodyColor} roughness={0.8} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.3, 0]} raycast={() => null}>
        <cylinderGeometry args={[0.36, 0.46, 0.12, 6]} />
        <meshStandardMaterial color={theme.roofColor} roughness={0.75} metalness={0.06} />
      </mesh>
      {type === 'campfire' && (
        <mesh position={[0, 0.32, 0]} raycast={() => null}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial
            color={theme.emberColor}
            emissive={theme.emberColor}
            emissiveIntensity={0.5}
            roughness={0.45}
            metalness={0.02}
          />
        </mesh>
      )}
      <Text
        raycast={() => null}
        position={[0, 0.56, 0]}
        rotation={[-0.52, 0, 0]}
        fontSize={0.14}
        color='#2f2b27'
        anchorX='center'
        anchorY='middle'
        outlineWidth={0.02}
        outlineColor='#f3ece1'
      >
        {theme.label}
      </Text>
      {isInteractive && (
        <Html position={[0, 0.34, 0]} center>
          <button
            type='button'
            aria-label={`Open ${theme.label}`}
            data-testid={`fixed-building-${type}-button`}
            className='h-9 w-9 rounded-full border border-transparent bg-transparent p-0 text-[0] transition-colors focus-visible:border-[#2f2b27] focus-visible:bg-[#fff8ec]/85'
            onClick={event => {
              event.stopPropagation()
              onActivate?.()
            }}
          >
            {theme.label}
          </button>
        </Html>
      )}
    </group>
  )
}
