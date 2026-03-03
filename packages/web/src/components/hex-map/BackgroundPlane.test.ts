import { describe, expect, it } from 'vitest'
import { MathUtils, OrthographicCamera } from 'three'
import { computeGroundPlaneCoverage } from './BackgroundPlane.js'

const CAMERA_DISTANCE = 24
const CAMERA_ELEVATION_DEGREES = 31

const createCamera = (zoom: number, targetX = 0, targetZ = 0): OrthographicCamera => {
  const aspectRatio = 1200 / 800
  const camera = new OrthographicCamera(
    -zoom * aspectRatio,
    zoom * aspectRatio,
    zoom,
    -zoom,
    0.1,
    200
  )
  const elevationRadians = MathUtils.degToRad(CAMERA_ELEVATION_DEGREES)

  camera.position.set(
    targetX,
    CAMERA_DISTANCE * Math.sin(elevationRadians),
    targetZ + CAMERA_DISTANCE * Math.cos(elevationRadians)
  )
  camera.lookAt(targetX, 0, targetZ)
  camera.updateProjectionMatrix()
  camera.updateMatrixWorld(true)

  return camera
}

describe('computeGroundPlaneCoverage', () => {
  it('tracks the viewed ground center as the camera pans', () => {
    const camera = createCamera(8, 14, -6)
    const coverage = computeGroundPlaneCoverage(camera, -0.05)

    expect(coverage).not.toBeNull()
    expect(Math.abs((coverage?.centerX ?? 0) - 14)).toBeLessThan(0.15)
    expect(Math.abs((coverage?.centerZ ?? 0) + 6)).toBeLessThan(0.15)
  })

  it('expands ground coverage as zoom-out increases', () => {
    const closeCoverage = computeGroundPlaneCoverage(createCamera(8), -0.05)
    const farCoverage = computeGroundPlaneCoverage(createCamera(16), -0.05)

    expect(closeCoverage).not.toBeNull()
    expect(farCoverage).not.toBeNull()
    expect(farCoverage?.width).toBeGreaterThan((closeCoverage?.width ?? 0) * 1.9)
    expect(farCoverage?.depth).toBeGreaterThan((closeCoverage?.depth ?? 0) * 1.9)
  })
})
