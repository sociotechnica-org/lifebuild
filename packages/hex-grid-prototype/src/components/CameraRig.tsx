import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGameState } from '../store/gameState.js'

const PAN_SPEED = 15
const ZOOM_SPEED = 0.02
const MIN_ZOOM = 5
const MAX_ZOOM = 50
const INITIAL_ZOOM = 20
const CAMERA_DISTANCE = 50

export function CameraRig() {
  const { camera, size } = useThree()
  const target = useRef(new THREE.Vector3(0, 0, 0))
  const keys = useRef(new Set<string>())
  const zoom = useRef(INITIAL_ZOOM)
  const elevation = useGameState(s => s.cameraElevation)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
      }
      keys.current.add(e.key)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY * ZOOM_SPEED
      zoom.current = THREE.MathUtils.clamp(zoom.current + delta, MIN_ZOOM, MAX_ZOOM)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('wheel', onWheel)
    }
  }, [])

  useFrame((_, delta) => {
    const ortho = camera as THREE.OrthographicCamera

    // Pan based on arrow keys
    let dx = 0
    let dz = 0
    if (keys.current.has('ArrowLeft')) dx -= PAN_SPEED * delta
    if (keys.current.has('ArrowRight')) dx += PAN_SPEED * delta
    if (keys.current.has('ArrowUp')) dz -= PAN_SPEED * delta
    if (keys.current.has('ArrowDown')) dz += PAN_SPEED * delta

    target.current.x += dx
    target.current.z += dz

    // Update frustum for zoom
    const aspect = size.width / size.height
    ortho.left = -zoom.current * aspect
    ortho.right = zoom.current * aspect
    ortho.top = zoom.current
    ortho.bottom = -zoom.current
    ortho.updateProjectionMatrix()

    // Arc the camera on a circle from south, based on elevation angle
    // 0° = flat on the ground looking along the surface
    // 90° = directly overhead looking straight down
    const elevRad = THREE.MathUtils.degToRad(Math.max(elevation, 1)) // clamp to avoid degenerate lookAt
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
