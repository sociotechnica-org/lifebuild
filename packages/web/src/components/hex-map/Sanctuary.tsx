import { hexToWorld } from '@lifebuild/shared/hex'
import React from 'react'
import { LandmarkSprite } from './LandmarkSprite.js'
import { SANCTUARY_PROJECT_HEX_COORDS } from './placementRules.js'

type SanctuaryProps = {
  textureUrl?: string
  onSelect?: () => void
}

const DEFAULT_TEXTURE_URL = '/landmarks/white-rectangle.png'

export const Sanctuary: React.FC<SanctuaryProps> = ({
  textureUrl = DEFAULT_TEXTURE_URL,
  onSelect,
}) => {
  const [centerX, centerZ] = hexToWorld(SANCTUARY_PROJECT_HEX_COORDS[0]!, 1)

  return (
    <group>
      {SANCTUARY_PROJECT_HEX_COORDS.map((coord, index) => (
        <LandmarkSprite
          key={`sanctuary-${coord.q}-${coord.r}`}
          coord={coord}
          textureUrl={textureUrl}
          width={index === 0 ? 1.9 : 1.6}
          height={index === 0 ? 0.98 : 0.9}
          tint={index === 0 ? '#ffffff' : '#f6eee3'}
          opacity={0.96}
          onClick={onSelect}
        />
      ))}
      <mesh position={[centerX, 0.24, centerZ]}>
        <cylinderGeometry args={[1.45, 1.45, 0.16, 6]} />
        <meshStandardMaterial color='#f0dbc0' emissive='#d8b792' emissiveIntensity={0.18} />
      </mesh>
    </group>
  )
}
