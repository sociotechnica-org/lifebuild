import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import { Html } from '@react-three/drei'
import React, { useMemo } from 'react'
import { LandmarkSprite } from './LandmarkSprite.js'
import type { FixedBuildingType } from './placementRules.js'

const BASE_HEX_SIZE = 1
const LANDMARK_TEXTURE_URL = '/landmarks/white-rectangle.png'

const BUILDING_THEME: Record<
  FixedBuildingType,
  { label: string; width: number; height: number; tint: string }
> = {
  campfire: {
    label: 'Campfire',
    width: 1.34,
    height: 0.7,
    tint: '#ffe6c7',
  },
  sanctuary: {
    label: 'Sanctuary',
    width: 1.7,
    height: 0.9,
    tint: '#ffffff',
  },
  workshop: {
    label: 'Workshop',
    width: 1.58,
    height: 0.86,
    tint: '#f6eee3',
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
      data-testid={`fixed-building-${type}`}
      userData={{ type: 'fixed-building', building: type, coord }}
    >
      <LandmarkSprite
        coord={coord}
        textureUrl={LANDMARK_TEXTURE_URL}
        width={theme.width}
        height={theme.height}
        tint={theme.tint}
        opacity={0.96}
        onClick={isInteractive ? onActivate : undefined}
      />
      {type === 'campfire' && (
        <mesh position={[x, 0.4, z + 0.08]} raycast={() => null}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial
            color='#ffd8a8'
            emissive='#ffae54'
            emissiveIntensity={0.45}
            roughness={0.45}
            metalness={0.02}
          />
        </mesh>
      )}
      {isInteractive && (
        <Html position={[x, 0.36, z]} center>
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
