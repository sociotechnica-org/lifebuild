import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import { Html } from '@react-three/drei'
import React, { useMemo } from 'react'
import { LandmarkSprite } from './LandmarkSprite.js'
import type { FixedBuildingType } from './placementRules.js'
import type { MapSpriteOrigin } from '../life-map/mapSpriteDebugConfig.js'

const BASE_HEX_SIZE = 1
const LANDMARK_TEXTURE_URL = '/landmarks/white-rectangle.png'
const SANCTUARY_TEXTURE_URL = '/sprites/sanctuary.png'
const WORKSHOP_TEXTURE_URL = '/sprites/house2.png'
const SANCTUARY_TEXTURE_ASPECT = 539 / 516
const WORKSHOP_TEXTURE_ASPECT = 310 / 329

const BUILDING_THEME: Record<
  FixedBuildingType,
  { label: string; width?: number; height: number; textureAspect?: number; tint: string }
> = {
  campfire: {
    label: 'Campfire',
    width: 1.34,
    height: 0.7,
    tint: '#ffe6c7',
  },
  sanctuary: {
    label: 'Sanctuary',
    height: 0.9,
    textureAspect: SANCTUARY_TEXTURE_ASPECT,
    tint: '#ffffff',
  },
  workshop: {
    label: 'Workshop',
    height: 0.86,
    textureAspect: WORKSHOP_TEXTURE_ASPECT,
    tint: '#f6eee3',
  },
}

type FixedBuildingProps = {
  type: FixedBuildingType
  coord: HexCoord
  sanctuaryScale?: number
  workshopScale?: number
  sanctuaryOrigin?: MapSpriteOrigin
  workshopOrigin?: MapSpriteOrigin
  onActivate?: () => void
}

export const FixedBuilding: React.FC<FixedBuildingProps> = ({
  type,
  coord,
  sanctuaryScale = 1,
  workshopScale = 1,
  sanctuaryOrigin = { x: 0, y: 0.45 },
  workshopOrigin = { x: 0, y: 0.45 },
  onActivate,
}) => {
  const [x, z] = useMemo(() => hexToWorld(coord, BASE_HEX_SIZE), [coord.q, coord.r, coord.s])
  const theme = BUILDING_THEME[type]
  const isInteractive = type !== 'campfire' && Boolean(onActivate)
  const landmarkTextureUrl =
    type === 'sanctuary'
      ? SANCTUARY_TEXTURE_URL
      : type === 'workshop'
        ? WORKSHOP_TEXTURE_URL
        : LANDMARK_TEXTURE_URL
  const spriteScale =
    type === 'sanctuary' ? sanctuaryScale : type === 'workshop' ? workshopScale : 1
  const spriteOrigin =
    type === 'sanctuary' ? sanctuaryOrigin : type === 'workshop' ? workshopOrigin : undefined
  const baseSpriteWidth =
    theme.width ?? (theme.textureAspect ? theme.height * theme.textureAspect : theme.height)

  return (
    <group
      data-testid={`fixed-building-${type}`}
      userData={{ type: 'fixed-building', building: type, coord }}
    >
      <LandmarkSprite
        coord={coord}
        textureUrl={landmarkTextureUrl}
        width={baseSpriteWidth * spriteScale}
        height={theme.height * spriteScale}
        origin={spriteOrigin}
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
