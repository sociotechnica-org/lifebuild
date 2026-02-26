import { useState, useCallback, useEffect, useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { Link } from 'react-router-dom'

/**
 * Campfire Reveal Prototype (3D)
 *
 * Layout: hex map (full viewport), chat panel slides in on right.
 * Camera frustum offsets to keep map centered in visible area when panel is open.
 * Campfire in bottom-left, 3 shadowed houses at top, project materializes
 * next to houses with a sketch/draw-in effect.
 *
 * @see .context/onboarding-visual-mood.md
 */

// ─── Types ──────────────────────────────────────────────────────────

type Phase =
  | 'idle'
  | 'zooming'
  | 'greeting'
  | 'question'
  | 'input'
  | 'reflection'
  | 'reveal'
  | 'confidence'
  | 'farewell'
  | 'explore'

// ─── Constants ──────────────────────────────────────────────────────

const HEX_SIZE = 1.0
const HEX_HEIGHT = 0.15
const GRID_RADIUS = 4

const CAMPFIRE_HEX = { q: -3, r: 3, s: 0 }

// Top three hexes of the map (row r=-3, centered near top)
const HOUSE_HEXES = [
  { q: -1, r: -3, s: 4 },
  { q: 0, r: -3, s: 3 },
  { q: 1, r: -3, s: 2 },
]
const HOUSE_SPRITES = ['/sprites/house1.png', '/sprites/house2.png', '/sprites/house3.png']

const PROJECT_HEX = { q: 0, r: 1, s: -1 }

const ZOOM_DURATION = 1800
const GREETING_DELAY = 800
const QUESTION_DELAY = 1800
const REFLECTION_HOLD = 2500
const REVEAL_DURATION = 1500
const CONFIDENCE_DELAY = 1500
const FAREWELL_DELAY = 2000
const JARVIS_FADE_OUT = 2000

// Chat panel width as fraction of viewport
const PANEL_FRACTION = 0.35

// ─── Hex Math ───────────────────────────────────────────────────────

function hexToWorld(coord: { q: number; r: number }, size: number): [number, number] {
  const x = size * Math.sqrt(3) * (coord.q + coord.r / 2)
  const z = size * (3 / 2) * coord.r
  return [x, z]
}

function generateHexGrid(radius: number): Array<{ q: number; r: number; s: number }> {
  const cells: Array<{ q: number; r: number; s: number }> = []
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const s = -q - r
      if (Math.abs(s) <= radius) {
        cells.push({ q, r, s })
      }
    }
  }
  return cells
}

function hexEquals(a: { q: number; r: number }, b: { q: number; r: number }) {
  return a.q === b.q && a.r === b.r
}

// ─── Simplex noise GLSL ─────────────────────────────────────────────

const SIMPLEX_NOISE_GLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`

// ─── Dark hex cell shader ───────────────────────────────────────────

const darkHexVertex = `
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const darkHexFragment = `
  precision highp float;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  ${SIMPLEX_NOISE_GLSL}

  float hexEdgeDist(vec2 p, float R) {
    float inR = R * 0.8660254;
    vec2 q = abs(p);
    float d = max(q.x, 0.5 * q.x + 0.8660254 * q.y);
    return inR - d;
  }

  void main() {
    vec2 wp = vWorldPos.xz;
    float n1 = snoise(vec3(wp * 0.08, 0.0)) * 0.5 + 0.5;
    float n2 = snoise(vec3(wp * 0.2, 3.7)) * 0.5 + 0.5;
    float grain = snoise(vec3(wp * 4.0, 7.3));

    vec3 color = vec3(0.08, 0.06, 0.04);
    color += vec3(0.03, 0.02, 0.01) * n1;
    color += vec3(0.02, 0.015, 0.01) * n2;
    color += grain * 0.008;

    float dist = hexEdgeDist(vLocalPos.xz, 1.0);
    float edgeFactor = 1.0 - smoothstep(0.0, 0.05, dist);
    color *= 1.0 - edgeFactor * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`

function createDarkHexMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: darkHexVertex,
    fragmentShader: darkHexFragment,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

// ─── Campfire glow hex shader ───────────────────────────────────────

const glowHexFragment = `
  precision highp float;
  uniform float uTime;
  uniform float uGlowIntensity;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  ${SIMPLEX_NOISE_GLSL}

  float hexEdgeDist(vec2 p, float R) {
    float inR = R * 0.8660254;
    vec2 q = abs(p);
    float d = max(q.x, 0.5 * q.x + 0.8660254 * q.y);
    return inR - d;
  }

  void main() {
    vec2 wp = vWorldPos.xz;
    float n1 = snoise(vec3(wp * 0.15, uTime * 0.3)) * 0.5 + 0.5;

    vec3 color = vec3(0.15, 0.08, 0.03);
    float dist = hexEdgeDist(vLocalPos.xz, 1.0);
    float centerGlow = smoothstep(0.0, 0.7, dist);
    float pulse = 0.7 + 0.3 * sin(uTime * 1.5 + n1 * 3.0);

    vec3 warmGlow = vec3(0.8, 0.35, 0.08) * centerGlow * pulse * uGlowIntensity;
    color += warmGlow;

    float edgeFactor = 1.0 - smoothstep(0.0, 0.06, dist);
    color = mix(color, vec3(0.6, 0.25, 0.05) * uGlowIntensity, edgeFactor * 0.5);

    gl_FragColor = vec4(color, 1.0);
  }
`

function createGlowHexMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uGlowIntensity: { value: 1.0 },
    },
    vertexShader: darkHexVertex,
    fragmentShader: glowHexFragment,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

// ─── Project hex shader ─────────────────────────────────────────────

const projectHexFragment = `
  precision highp float;
  uniform float uTime;
  uniform float uRevealProgress;
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  ${SIMPLEX_NOISE_GLSL}

  float hexEdgeDist(vec2 p, float R) {
    float inR = R * 0.8660254;
    vec2 q = abs(p);
    float d = max(q.x, 0.5 * q.x + 0.8660254 * q.y);
    return inR - d;
  }

  void main() {
    vec2 wp = vWorldPos.xz;
    float n1 = snoise(vec3(wp * 0.1, 0.0)) * 0.5 + 0.5;

    vec3 color = mix(
      vec3(0.08, 0.06, 0.04),
      vec3(0.78, 0.68, 0.50),
      uRevealProgress
    );
    color += n1 * 0.05 * uRevealProgress;

    float dist = hexEdgeDist(vLocalPos.xz, 1.0);
    float edgeFactor = 1.0 - smoothstep(0.0, 0.08, dist);
    float pulse = 0.8 + 0.2 * sin(uTime * 2.0);
    vec3 edgeGlow = vec3(1.0, 0.75, 0.3) * edgeFactor * uRevealProgress * pulse;
    color += edgeGlow * 0.6;

    gl_FragColor = vec4(color, 1.0);
  }
`

function createProjectHexMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRevealProgress: { value: 0 },
    },
    vertexShader: darkHexVertex,
    fragmentShader: projectHexFragment,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

// ─── Sprite shaders ─────────────────────────────────────────────────

const spriteVertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Standard sprite: removes white/black backgrounds, applies darkness
const spriteFragment = `
  uniform sampler2D uTexture;
  uniform float uDarkness;
  varying vec2 vUv;
  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    float brightness = (tex.r + tex.g + tex.b) / 3.0;
    float alpha = tex.a;
    alpha *= 1.0 - smoothstep(0.82, 0.95, brightness);
    alpha *= smoothstep(0.02, 0.12, brightness);
    if (alpha < 0.01) discard;
    vec3 color = tex.rgb * (1.0 - uDarkness * 0.7);
    gl_FragColor = vec4(color, alpha);
  }
`

// Sketch-reveal sprite: materializes like being drawn into existence
const sketchRevealVertex = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const sketchRevealFragment = `
  precision highp float;
  uniform sampler2D uTexture;
  uniform float uReveal;  // 0 = invisible, 1 = fully drawn
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
    vec4 tex = texture2D(uTexture, vUv);
    float brightness = (tex.r + tex.g + tex.b) / 3.0;
    float alpha = tex.a;
    alpha *= 1.0 - smoothstep(0.82, 0.95, brightness);
    alpha *= smoothstep(0.02, 0.12, brightness);

    // Sketch reveal: use layered noise to create organic "drawing" threshold
    // Different frequencies give both broad strokes and fine detail
    float n1 = snoise(vec3(vUv * 4.0, 1.0)) * 0.5 + 0.5;
    float n2 = snoise(vec3(vUv * 8.0, 5.0)) * 0.5 + 0.5;
    float n3 = snoise(vec3(vUv * 16.0, 9.0)) * 0.5 + 0.5;
    float drawMask = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;

    // The reveal threshold sweeps from high→low as uReveal increases
    // so more pixels pass through as the drawing materializes
    float threshold = (1.0 - uReveal) * 1.3 - 0.15;
    float drawn = smoothstep(threshold - 0.1, threshold + 0.05, drawMask);

    // Ink edge effect: pixels near the leading edge get a warm glow
    float edge = smoothstep(threshold, threshold + 0.05, drawMask)
               * (1.0 - smoothstep(threshold + 0.05, threshold + 0.15, drawMask));
    vec3 inkGlow = vec3(0.9, 0.6, 0.2) * edge * 0.5;

    alpha *= drawn;
    if (alpha < 0.01) discard;

    vec3 color = tex.rgb + inkGlow;
    gl_FragColor = vec4(color, alpha);
  }
`

// ─── 3D Components ──────────────────────────────────────────────────

function DarkHexCell({ coord }: { coord: { q: number; r: number; s: number } }) {
  const [x, z] = hexToWorld(coord, HEX_SIZE)
  const material = useMemo(() => createDarkHexMaterial(), [])
  return (
    <group position={[x, 0, z]}>
      <mesh material={material}>
        <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, HEX_HEIGHT, 6]} />
      </mesh>
    </group>
  )
}

function CampfireHexCell({
  onClick,
  glowIntensity,
}: {
  onClick: () => void
  glowIntensity: number
}) {
  const [x, z] = hexToWorld(CAMPFIRE_HEX, HEX_SIZE)
  const material = useMemo(() => createGlowHexMaterial(), [])

  useFrame((_, delta) => {
    material.uniforms.uTime!.value += delta
    material.uniforms.uGlowIntensity!.value = glowIntensity
  })

  return (
    <group position={[x, 0, z]}>
      <mesh
        material={material}
        onClick={e => {
          e.stopPropagation()
          onClick()
        }}
        onPointerOver={e => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default'
        }}
      >
        <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, HEX_HEIGHT, 6]} />
      </mesh>
    </group>
  )
}

function ProjectHexCell({
  coord,
  revealProgress,
}: {
  coord: { q: number; r: number; s: number }
  revealProgress: number
}) {
  const [x, z] = hexToWorld(coord, HEX_SIZE)
  const material = useMemo(() => createProjectHexMaterial(), [])

  useFrame((_, delta) => {
    material.uniforms.uTime!.value += delta
    const current = material.uniforms.uRevealProgress!.value as number
    material.uniforms.uRevealProgress!.value = current + (revealProgress - current) * 0.03
  })

  return (
    <group position={[x, 0, z]}>
      <mesh material={material}>
        <cylinderGeometry args={[HEX_SIZE, HEX_SIZE, HEX_HEIGHT, 6]} />
      </mesh>
    </group>
  )
}

// ─── Map sprites ────────────────────────────────────────────────────

function MapSprite({
  coord,
  url,
  scale = 1.2,
  darkness = 0,
}: {
  coord: { q: number; r: number }
  url: string
  scale?: number
  darkness?: number
}) {
  const texture = useLoader(THREE.TextureLoader, url)
  const [x, z] = hexToWorld(coord, HEX_SIZE)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uDarkness: { value: darkness },
        },
        vertexShader: spriteVertex,
        fragmentShader: spriteFragment,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    [texture, darkness]
  )

  const aspect = texture.image ? texture.image.width / texture.image.height : 1

  return (
    <mesh
      position={[x, scale / 2, z + HEX_SIZE * 0.3]}
      rotation={[-Math.PI / 2 + 35 * (Math.PI / 180), 0, 0]}
      material={material}
    >
      <planeGeometry args={[scale * aspect, scale]} />
    </mesh>
  )
}

// Sprite that materializes with a sketch/draw effect
function SketchRevealSprite({
  coord,
  url,
  scale = 1.8,
  revealProgress,
  pulse = false,
}: {
  coord: { q: number; r: number }
  url: string
  scale?: number
  revealProgress: number
  pulse?: boolean
}) {
  const texture = useLoader(THREE.TextureLoader, url)
  const [x, z] = hexToWorld(coord, HEX_SIZE)
  const meshRef = useRef<THREE.Mesh>(null)
  const timeRef = useRef(0)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTexture: { value: texture },
          uReveal: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: sketchRevealVertex,
        fragmentShader: sketchRevealFragment,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: true,
      }),
    [texture]
  )

  useFrame((_, delta) => {
    material.uniforms.uTime!.value += delta
    const current = material.uniforms.uReveal!.value as number
    material.uniforms.uReveal!.value = current + (revealProgress - current) * 0.02

    // Subtle breathing pulse when fully revealed
    if (pulse && meshRef.current) {
      timeRef.current += delta
      const s = 1 + 0.03 * Math.sin(timeRef.current * 1.5)
      meshRef.current.scale.set(s, s, s)
    }
  })

  const aspect = texture.image ? texture.image.width / texture.image.height : 1

  return (
    <mesh
      ref={meshRef}
      position={[x, scale / 2, z + HEX_SIZE * 0.3]}
      rotation={[-Math.PI / 2 + 35 * (Math.PI / 180), 0, 0]}
      material={material}
    >
      <planeGeometry args={[scale * aspect, scale]} />
    </mesh>
  )
}

// Project label using drei's Html so it renders as DOM overlay
function ProjectLabel({
  coord,
  text,
  opacity,
}: {
  coord: { q: number; r: number }
  text: string
  opacity: number
}) {
  const [x, z] = hexToWorld(coord, HEX_SIZE)
  return (
    <Html
      position={[x, 0.2, z + HEX_SIZE * 1.6]}
      center
      style={{
        color: '#d4b06a',
        fontFamily: "'Georgia', serif",
        fontSize: 14,
        whiteSpace: 'nowrap',
        textShadow: '0 0 8px rgba(0,0,0,0.8)',
        opacity: Math.min(1, opacity * 1.5),
        pointerEvents: 'none',
        transition: 'opacity 0.3s',
      }}
    >
      {text}
    </Html>
  )
}

// ─── Campfire sprite with glow ──────────────────────────────────────

function CampfireSprite({ visible }: { visible: boolean }) {
  const [cx, cz] = hexToWorld(CAMPFIRE_HEX, HEX_SIZE)
  const lightRef = useRef<THREE.PointLight>(null)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    timeRef.current += delta
    if (lightRef.current) {
      const flicker = 0.8 + 0.2 * Math.sin(timeRef.current * 4) * Math.cos(timeRef.current * 2.7)
      lightRef.current.intensity = visible ? flicker * 3 : 0
    }
  })

  return (
    <group position={[cx, HEX_HEIGHT / 2, cz]}>
      <pointLight
        ref={lightRef}
        color='#ff8030'
        intensity={visible ? 3 : 0}
        distance={8}
        decay={2}
        position={[0, 0.8, 0]}
      />
      {visible && (
        <>
          <EmberParticle offset={0} />
          <EmberParticle offset={1.3} />
          <EmberParticle offset={2.7} />
          <EmberParticle offset={0.7} />
          <EmberParticle offset={3.5} />
        </>
      )}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color='#ff6020' transparent opacity={visible ? 0.9 : 0} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshBasicMaterial color='#ffaa40' transparent opacity={visible ? 0.8 : 0} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color='#cc3010' transparent opacity={visible ? 0.7 : 0} />
      </mesh>
    </group>
  )
}

function EmberParticle({ offset }: { offset: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const timeRef = useRef(offset)

  useFrame((_, delta) => {
    timeRef.current += delta
    if (ref.current) {
      const t = (timeRef.current % 3) / 3
      const angle = offset * 2.1
      ref.current.position.set(
        Math.sin(angle + t * 2) * 0.15,
        0.2 + t * 1.2,
        Math.cos(angle + t * 1.5) * 0.15
      )
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = (1 - t) * 0.8
    }
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.03, 4, 4]} />
      <meshBasicMaterial color='#ffaa50' transparent />
    </mesh>
  )
}

// ─── Animated camera rig ────────────────────────────────────────────

const IDLE_ZOOM = 10
const CLOSE_ZOOM = 5
const CAMERA_DISTANCE = 50
const IDLE_ELEVATION = 55

function AnimatedCameraRig({ phase, chatOpen }: { phase: Phase; chatOpen: boolean }) {
  const { camera, size } = useThree()
  const zoom = useRef(IDLE_ZOOM)
  const target = useRef(new THREE.Vector3(0, 0, 1))
  const panelOffset = useRef(0)
  const [cx, cz] = hexToWorld(CAMPFIRE_HEX, HEX_SIZE)

  let targetZoom: number
  let targetPos: THREE.Vector3
  if (phase === 'idle') {
    targetZoom = IDLE_ZOOM
    targetPos = new THREE.Vector3(0, 0, 1)
  } else if (
    phase === 'reveal' ||
    phase === 'confidence' ||
    phase === 'farewell' ||
    phase === 'explore'
  ) {
    targetZoom = IDLE_ZOOM - 2
    targetPos = new THREE.Vector3(0.5, 0, 0.5)
  } else {
    targetZoom = CLOSE_ZOOM + 1
    targetPos = new THREE.Vector3(cx * 0.6, 0, cz * 0.6)
  }

  useFrame(() => {
    const ortho = camera as THREE.OrthographicCamera

    zoom.current += (targetZoom - zoom.current) * 0.04
    target.current.lerp(targetPos, 0.04)

    // Offset camera frustum so the map stays centered in the visible
    // (non-panel) area. Panel is on the right, so shift frustum RIGHT
    // to make world origin appear at the center of the left 65%.
    const targetOffset = chatOpen ? PANEL_FRACTION : 0
    panelOffset.current += (targetOffset - panelOffset.current) * 0.04

    const aspect = size.width / size.height
    const halfW = zoom.current * aspect
    const shift = halfW * panelOffset.current
    ortho.left = -halfW + shift
    ortho.right = halfW + shift
    ortho.top = zoom.current
    ortho.bottom = -zoom.current
    ortho.updateProjectionMatrix()

    const elevRad = THREE.MathUtils.degToRad(IDLE_ELEVATION)
    const d = CAMERA_DISTANCE
    ortho.position.set(
      target.current.x,
      d * Math.sin(elevRad),
      target.current.z + d * Math.cos(elevRad)
    )
    ortho.lookAt(target.current)
  })

  return null
}

// ─── Chat Panel ─────────────────────────────────────────────────────

// Keyframe animations injected once
const PANEL_STYLES = `
@keyframes jarvis-breathe {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.008) translateY(-1.5px); }
}
@keyframes eye-glow {
  0%, 100% { opacity: 0; }
  40%, 60% { opacity: 0.35; }
}
`

function getPortraitFlex(phase: Phase): number {
  switch (phase) {
    case 'explore':
      return 0 // collapsed — panel minimized
    case 'input':
      return 0.25
    case 'reveal':
      return 0.32
    case 'farewell':
      return 0.35
    default:
      return 0.4
  }
}

function getPortraitOpacity(phase: Phase): number {
  if (phase === 'explore') return 0
  if (phase === 'farewell') return 0.4
  return 1
}

function getPanelMinimized(phase: Phase): boolean {
  return phase === 'explore'
}

function ChatPanel({
  phase,
  jarvisText,
  onSubmit,
}: {
  phase: Phase
  jarvisText: string
  onSubmit: (value: string) => void
}) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (phase === 'input' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [phase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [jarvisText])

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed) {
      onSubmit(trimmed)
      setInputValue('')
    }
  }, [inputValue, onSubmit])

  const showInput = phase === 'input'
  const minimized = getPanelMinimized(phase)
  const portraitFlex = getPortraitFlex(phase)
  const portraitOpacity = getPortraitOpacity(phase)

  return (
    <>
      <style>{PANEL_STYLES}</style>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: minimized ? 'auto' : `${PANEL_FRACTION * 100}%`,
          minWidth: minimized ? 0 : 320,
          maxWidth: minimized ? 'none' : 420,
          height: minimized ? 'auto' : '100%',
          background: minimized
            ? 'rgba(245, 239, 230, 0.92)'
            : 'linear-gradient(180deg, #f5efe6 0%, #ede3d4 100%)',
          borderLeft: minimized ? 'none' : '1px solid #c4a87a',
          borderBottom: minimized ? '1px solid #c4a87a' : 'none',
          borderBottomLeftRadius: minimized ? 10 : 0,
          display: 'flex',
          flexDirection: minimized ? 'row' : 'column',
          alignItems: minimized ? 'center' : 'stretch',
          gap: minimized ? 10 : 0,
          padding: minimized ? '8px 16px' : 0,
          zIndex: 10,
          overflow: 'hidden',
          transition:
            'width 600ms ease, min-width 600ms ease, height 600ms ease, padding 600ms ease, border-radius 600ms ease',
        }}
      >
        {/* Minimized bar — small avatar + name */}
        {minimized && (
          <>
            <img
              src='/characters/jarvis.png'
              alt='Jarvis'
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                objectPosition: 'center 10%',
                border: '1.5px solid #c4a87a',
              }}
            />
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontWeight: 700,
                fontSize: 16,
                color: '#5c4a32',
              }}
            >
              Jarvis
            </span>
          </>
        )}
        {/* Full panel content — hidden when minimized */}
        {!minimized && (
          <>
            {/* Portrait region — Jarvis looms large */}
            <div
              style={{
                flex: `0 0 ${portraitFlex * 100}%`,
                position: 'relative',
                overflow: 'hidden',
                transition: 'flex-basis 800ms cubic-bezier(0.4, 0, 0.2, 1)',
                background: '#f0ebe3',
              }}
            >
              <img
                src='/characters/jarvis.png'
                alt='Jarvis'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center 15%',
                  maskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 55%, transparent 100%)',
                  animation: 'jarvis-breathe 4s ease-in-out infinite',
                  willChange: 'transform',
                  opacity: portraitOpacity,
                  transition: 'opacity 800ms ease',
                }}
              />

              {/* Eye glow overlay */}
              <div
                style={{
                  position: 'absolute',
                  top: '22%',
                  left: '48%',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(100, 160, 255, 0.5), transparent 60%)',
                  animation: 'eye-glow 5s ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />

              {/* Name label overlaid at bottom of portrait */}
              <span
                style={{
                  position: 'absolute',
                  bottom: 20,
                  left: 20,
                  fontFamily: "'Caveat', cursive",
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#5c4a32',
                  textShadow: '0 1px 4px rgba(245, 239, 230, 0.8)',
                  pointerEvents: 'none',
                }}
              >
                Jarvis
              </span>
            </div>

            {/* Chat messages — handwriting font */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 20px',
                boxShadow: 'inset 0 8px 12px -8px rgba(92, 74, 50, 0.12)',
              }}
            >
              {jarvisText && (
                <div
                  style={{
                    color: '#3d2e1a',
                    fontFamily: "'Caveat', cursive",
                    fontSize: 22,
                    fontWeight: 600,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    opacity: 1,
                    transition: 'opacity 500ms ease',
                  }}
                >
                  {jarvisText}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area — Georgia serif for the builder's voice */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #d4c0a0',
                opacity: showInput ? 1 : 0.3,
                transition: 'opacity 400ms ease',
              }}
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder={showInput ? 'Type your answer...' : ''}
                  disabled={!showInput}
                  rows={2}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: showInput ? '#fff' : '#f0ebe3',
                    border: '1px solid #c4a87a',
                    borderRadius: 6,
                    color: '#3d2e1a',
                    fontFamily: "'Georgia', serif",
                    fontSize: 15,
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.4,
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={!showInput || !inputValue.trim()}
                  style={{
                    padding: '10px 16px',
                    background: showInput && inputValue.trim() ? '#8b7355' : '#c4b89a',
                    border: 'none',
                    borderRadius: 6,
                    color: '#fff',
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 700,
                    fontSize: 16,
                    cursor: showInput && inputValue.trim() ? 'pointer' : 'default',
                    alignSelf: 'flex-end',
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── SVG automobile placeholder ─────────────────────────────────────

const AUTOMOBILE_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
  <g fill="none" stroke="#5c4a32" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 75 L30 60 Q30 50 40 50 L70 50 L90 30 Q95 25 100 25 L140 25 Q150 25 155 35 L170 50 Q180 50 185 55 L185 75" fill="#d4c0a0"/>
    <path d="M70 50 L90 30 Q95 25 100 25 L140 25 Q150 25 155 35 L170 50" fill="#c4a87a"/>
    <rect x="95" y="30" width="25" height="18" rx="2" fill="#8b7355" opacity="0.4"/>
    <rect x="125" y="30" width="30" height="18" rx="2" fill="#8b7355" opacity="0.4"/>
    <line x1="25" y1="80" x2="190" y2="80"/>
    <circle cx="60" cy="80" r="14" fill="#3d2e1a" stroke="#5c4a32" stroke-width="3"/>
    <circle cx="60" cy="80" r="6" fill="#8b7355"/>
    <circle cx="155" cy="80" r="14" fill="#3d2e1a" stroke="#5c4a32" stroke-width="3"/>
    <circle cx="155" cy="80" r="6" fill="#8b7355"/>
    <circle cx="183" cy="58" r="4" fill="#ffd080"/>
    <line x1="110" y1="50" x2="120" y2="50"/>
  </g>
</svg>
`)}`

// ─── Main Prototype Component ───────────────────────────────────────

export function CampfireRevealPrototype() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [projectName, setProjectName] = useState('')
  const [jarvisText, setJarvisText] = useState('')
  const [projectReveal, setProjectReveal] = useState(0)

  const specialHexes = useMemo(() => [CAMPFIRE_HEX, PROJECT_HEX, ...HOUSE_HEXES], [])

  const gridCells = useMemo(() => {
    const all = generateHexGrid(GRID_RADIUS)
    return all.filter(c => !specialHexes.some(s => hexEquals(c, s)))
  }, [specialHexes])

  const handleCampfireClick = useCallback(() => {
    if (phase !== 'idle') return
    setPhase('zooming')

    setTimeout(() => {
      setPhase('greeting')
      setJarvisText('Hey. Glad you\u2019re here.')

      setTimeout(() => {
        setPhase('question')
        setJarvisText(
          'Hey. Glad you\u2019re here.\n\nWhat\u2019s one project in your life you could finish in the next week \u2014 where getting it done would just feel amazing?'
        )

        setTimeout(() => {
          setPhase('input')
        }, QUESTION_DELAY)
      }, GREETING_DELAY)
    }, ZOOM_DURATION)
  }, [phase])

  const handleAnswer = useCallback((answer: string) => {
    setProjectName(answer)

    setJarvisText(`${answer}. Yeah \u2014 that\u2019s a good one.`)
    setPhase('reflection')

    setTimeout(() => {
      setPhase('reveal')
      setJarvisText('')
      setProjectReveal(1)
    }, REFLECTION_HOLD)

    setTimeout(
      () => {
        setJarvisText('You came to the right place.')
        setPhase('confidence')
      },
      REFLECTION_HOLD + REVEAL_DURATION + CONFIDENCE_DELAY
    )

    setTimeout(
      () => {
        setJarvisText('We\u2019ll talk soon.')
        setPhase('farewell')
      },
      REFLECTION_HOLD + REVEAL_DURATION + CONFIDENCE_DELAY + FAREWELL_DELAY
    )

    setTimeout(
      () => {
        setJarvisText('')
        setPhase('explore')
      },
      REFLECTION_HOLD + REVEAL_DURATION + CONFIDENCE_DELAY + FAREWELL_DELAY + JARVIS_FADE_OUT
    )
  }, [])

  const handleReset = useCallback(() => {
    setPhase('idle')
    setProjectName('')
    setJarvisText('')
    setProjectReveal(0)
  }, [])

  const campfireVisible = phase !== 'explore'
  // Chat panel hidden in idle, visible once campfire is clicked
  const chatVisible = phase !== 'idle'
  const projectSpriteVisible =
    phase === 'reveal' || phase === 'confidence' || phase === 'farewell' || phase === 'explore'

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#060504',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Canvas
        orthographic
        camera={{ position: [0, 40, 35], zoom: 1, near: 0.1, far: 1000 }}
        gl={{ antialias: true }}
        style={{ background: '#060504' }}
      >
        <ambientLight color='#1a1208' intensity={0.3} />
        <hemisphereLight color='#0a0806' groundColor='#0a0806' intensity={0.1} />

        <AnimatedCameraRig phase={phase} chatOpen={chatVisible && phase !== 'explore'} />

        {/* Dark hex grid */}
        {gridCells.map(c => (
          <DarkHexCell key={`${c.q},${c.r}`} coord={c} />
        ))}

        {/* House hexes */}
        {HOUSE_HEXES.map(c => (
          <DarkHexCell key={`house-${c.q},${c.r}`} coord={c} />
        ))}

        {/* House sprites — small, deeply shadowed */}
        <Suspense fallback={null}>
          {HOUSE_HEXES.map((c, i) => (
            <MapSprite
              key={`hsprite-${i}`}
              coord={c}
              url={HOUSE_SPRITES[i]!}
              scale={1.2}
              darkness={0.85}
            />
          ))}
        </Suspense>

        {/* Campfire hex */}
        <CampfireHexCell onClick={handleCampfireClick} glowIntensity={campfireVisible ? 1 : 0} />
        <CampfireSprite visible={campfireVisible} />

        {/* Project hex */}
        <ProjectHexCell coord={PROJECT_HEX} revealProgress={projectReveal} />

        {/* Project sprite — sketch reveal */}
        <Suspense fallback={null}>
          {projectSpriteVisible && (
            <SketchRevealSprite
              coord={PROJECT_HEX}
              url={AUTOMOBILE_SVG}
              scale={1.5}
              revealProgress={projectReveal}
              pulse={phase === 'explore'}
            />
          )}
        </Suspense>

        {/* Project label */}
        {projectSpriteVisible && projectName && (
          <ProjectLabel coord={PROJECT_HEX} text={projectName} opacity={projectReveal} />
        )}
      </Canvas>

      {/* Chat panel — hidden in idle, appears after campfire click */}
      {chatVisible && <ChatPanel phase={phase} jarvisText={jarvisText} onSubmit={handleAnswer} />}

      {/* Phase indicator */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          color: 'rgba(255, 180, 100, 0.3)',
          fontFamily: 'monospace',
          fontSize: 11,
          zIndex: 20,
        }}
      >
        phase: {phase}
      </div>

      {phase === 'idle' && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            color: 'rgba(255, 160, 80, 0.4)',
            fontFamily: 'monospace',
            fontSize: 12,
            animation: 'pulse-hint 2s ease-in-out infinite',
            zIndex: 20,
          }}
        >
          Click the campfire
        </div>
      )}

      <style>{`
        @keyframes pulse-hint {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <button
        onClick={handleReset}
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          padding: '6px 12px',
          background: 'rgba(40, 33, 25, 0.8)',
          border: '1px solid rgba(255, 180, 100, 0.3)',
          borderRadius: 4,
          color: 'rgba(255, 180, 100, 0.5)',
          fontFamily: 'monospace',
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 20,
        }}
      >
        Reset
      </button>

      <Link
        to='/'
        style={{
          position: 'absolute',
          bottom: 16,
          left: 90,
          padding: '6px 12px',
          color: 'rgba(255, 180, 100, 0.3)',
          fontFamily: 'monospace',
          fontSize: 11,
          textDecoration: 'none',
          zIndex: 20,
        }}
      >
        Playground index
      </Link>
    </div>
  )
}
