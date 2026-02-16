import { useLoader } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { hexToWorld } from '../hex/math.js'
import type { HexCoord } from '../hex/types.js'

// Vertex shader — pass through UVs
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment shader — use texture alpha, plus fade near-white and near-black backgrounds
const fragmentShader = `
  uniform sampler2D uTexture;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    float brightness = (tex.r + tex.g + tex.b) / 3.0;
    // Start with texture alpha
    float alpha = tex.a;
    // Also fade near-white backgrounds
    alpha *= 1.0 - smoothstep(0.82, 0.95, brightness);
    // Also fade near-black backgrounds
    alpha *= smoothstep(0.02, 0.12, brightness);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(tex.rgb, alpha);
  }
`

interface MapSpriteProps {
  coord: HexCoord
  url: string
  scale?: number
}

const HEX_SIZE = 1.0

export function MapSprite({ coord, url, scale = 2.0 }: MapSpriteProps) {
  const texture = useLoader(THREE.TextureLoader, url)
  const [x, z] = hexToWorld(coord, HEX_SIZE)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTexture: { value: texture } },
        vertexShader,
        fragmentShader,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    [texture]
  )

  // Compute aspect ratio from texture
  const aspect = texture.image ? texture.image.width / texture.image.height : 1

  return (
    <mesh
      position={[x, scale / 2, z + HEX_SIZE * 0.4]}
      // Tilt the plane to face the camera at roughly our default elevation
      rotation={[-Math.PI / 2 + 35 * (Math.PI / 180), 0, 0]}
      material={material}
    >
      <planeGeometry args={[scale * aspect, scale]} />
    </mesh>
  )
}
