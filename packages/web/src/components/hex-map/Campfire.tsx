import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { LandmarkSprite } from './LandmarkSprite.js'
import { CAMPFIRE_PROJECT_HEX_COORD } from './placementRules.js'

type CampfireProps = {
  textureUrl?: string
  onSelect?: () => void
}

const DEFAULT_TEXTURE_URL = '/landmarks/white-rectangle.png'

export const Campfire: React.FC<CampfireProps> = ({
  textureUrl = DEFAULT_TEXTURE_URL,
  onSelect,
}) => {
  const [x, z] = hexToWorld(CAMPFIRE_PROJECT_HEX_COORD, 1)

  return (
    <group>
      <LandmarkSprite
        coord={CAMPFIRE_PROJECT_HEX_COORD}
        textureUrl={textureUrl}
        width={1.35}
        height={0.7}
        tint='#ffe6c7'
        opacity={0.95}
        onClick={onSelect}
      />
      <mesh position={[x, 0.22, z]}>
        <cylinderGeometry args={[0.52, 0.52, 0.1, 6]} />
        <meshStandardMaterial color='#f1d7b0' emissive='#f5a85f' emissiveIntensity={0.22} />
      </mesh>
      <mesh position={[x, 0.4, z + 0.08]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color='#ffd8a8' emissive='#ffae54' emissiveIntensity={0.45} />
      </mesh>
    </group>
  )
}
