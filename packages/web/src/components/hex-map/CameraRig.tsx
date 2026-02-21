import { useThree } from '@react-three/fiber'
import { useLayoutEffect } from 'react'
import { MathUtils, OrthographicCamera, Vector3 } from 'three'

const CAMERA_DISTANCE = 24
const CAMERA_ELEVATION_DEGREES = 31
const ORTHOGRAPHIC_VIEW_HEIGHT = 11.5

export function CameraRig() {
  const { camera, size } = useThree()

  useLayoutEffect(() => {
    const orthoCamera = camera as OrthographicCamera
    const aspectRatio = size.width / Math.max(size.height, 1)

    orthoCamera.left = -ORTHOGRAPHIC_VIEW_HEIGHT * aspectRatio
    orthoCamera.right = ORTHOGRAPHIC_VIEW_HEIGHT * aspectRatio
    orthoCamera.top = ORTHOGRAPHIC_VIEW_HEIGHT
    orthoCamera.bottom = -ORTHOGRAPHIC_VIEW_HEIGHT
    orthoCamera.near = 0.1
    orthoCamera.far = 200

    const elevationRadians = MathUtils.degToRad(CAMERA_ELEVATION_DEGREES)
    orthoCamera.position.set(
      0,
      CAMERA_DISTANCE * Math.sin(elevationRadians),
      CAMERA_DISTANCE * Math.cos(elevationRadians)
    )
    orthoCamera.lookAt(new Vector3(0, 0, 0))
    orthoCamera.updateProjectionMatrix()
  }, [camera, size.height, size.width])

  return null
}
