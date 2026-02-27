import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { MathUtils, OrthographicCamera, Vector3 } from 'three'

const ARROW_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])
const PAN_SPEED = 12
const ZOOM_SPEED = 0.02
const MIN_ZOOM = 4
const MAX_ZOOM = 24
const INITIAL_ZOOM = 8
const CAMERA_DISTANCE = 24
const CAMERA_ELEVATION_DEGREES = 31

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  if (target.isContentEditable) {
    return true
  }

  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  if (target.closest('[contenteditable="true"]')) {
    return true
  }

  return false
}

export function CameraRig() {
  const { camera, size, gl } = useThree()
  const keys = useRef(new Set<string>())
  const target = useRef(new Vector3(0, 0, 0))
  const zoom = useRef(INITIAL_ZOOM)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const canvas = gl.domElement

    const onKeyDown = (event: KeyboardEvent) => {
      if (!ARROW_KEYS.has(event.key)) {
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      event.preventDefault()
      keys.current.add(event.key)
    }

    const onKeyUp = (event: KeyboardEvent) => {
      if (!ARROW_KEYS.has(event.key)) {
        return
      }
      keys.current.delete(event.key)
    }

    const onBlur = () => {
      keys.current.clear()
    }

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      zoom.current = MathUtils.clamp(zoom.current + event.deltaY * ZOOM_SPEED, MIN_ZOOM, MAX_ZOOM)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      keys.current.clear()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, delta) => {
    const orthoCamera = camera as OrthographicCamera

    let dx = 0
    let dz = 0
    if (keys.current.has('ArrowLeft')) {
      dx -= PAN_SPEED * delta
    }
    if (keys.current.has('ArrowRight')) {
      dx += PAN_SPEED * delta
    }
    if (keys.current.has('ArrowUp')) {
      dz -= PAN_SPEED * delta
    }
    if (keys.current.has('ArrowDown')) {
      dz += PAN_SPEED * delta
    }

    target.current.x += dx
    target.current.z += dz

    const aspectRatio = size.width / Math.max(size.height, 1)
    orthoCamera.left = -zoom.current * aspectRatio
    orthoCamera.right = zoom.current * aspectRatio
    orthoCamera.top = zoom.current
    orthoCamera.bottom = -zoom.current
    orthoCamera.near = 0.1
    orthoCamera.far = 200
    orthoCamera.updateProjectionMatrix()

    const elevationRadians = MathUtils.degToRad(CAMERA_ELEVATION_DEGREES)
    orthoCamera.position.set(
      target.current.x,
      CAMERA_DISTANCE * Math.sin(elevationRadians),
      target.current.z + CAMERA_DISTANCE * Math.cos(elevationRadians)
    )
    orthoCamera.lookAt(target.current)
  })

  return null
}
