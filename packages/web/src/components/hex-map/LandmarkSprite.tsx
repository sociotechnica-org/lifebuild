import type { HexCoord } from '@lifebuild/shared/hex'
import { hexToWorld } from '@lifebuild/shared/hex'
import { useLoader } from '@react-three/fiber'
import React, { useEffect } from 'react'
import * as THREE from 'three'

type LandmarkSpriteProps = {
  coord: HexCoord
  textureUrl: string
  width: number
  height: number
  tint?: string
  opacity?: number
  elevation?: number
  zOffset?: number
  onClick?: () => void
}

const CAMERA_TILT_RADIANS = -Math.PI / 2 + (31 * Math.PI) / 180

export const LandmarkSprite: React.FC<LandmarkSpriteProps> = ({
  coord,
  textureUrl,
  width,
  height,
  tint = '#ffffff',
  opacity = 0.95,
  elevation = 0.58,
  zOffset = 0.45,
  onClick,
}) => {
  const texture = useLoader(THREE.TextureLoader, textureUrl)
  const [x, z] = hexToWorld(coord, 1)
  const canClick = typeof onClick === 'function'

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.needsUpdate = true
  }, [texture])

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  return (
    <mesh
      position={[x, elevation, z + zOffset]}
      rotation={[CAMERA_TILT_RADIANS, 0, 0]}
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
      }}
      onPointerOut={event => {
        event.stopPropagation()
        document.body.style.cursor = 'default'
      }}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        color={tint}
        transparent
        opacity={opacity}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
