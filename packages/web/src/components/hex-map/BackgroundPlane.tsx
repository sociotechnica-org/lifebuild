import { useFrame } from '@react-three/fiber'
import React, { useEffect, useMemo, useRef } from 'react'
import { Mesh, OrthographicCamera, Vector3 } from 'three'
import {
  JESS_PREFERENCE_PARCHMENT_PARAMS,
  applyParchmentUniforms,
  createParchmentMaterial,
} from './shaders/parchmentShader.js'

const BACKGROUND_PLANE_Y = -0.05
const BACKGROUND_OVERSCAN = 1.35
const NDC_CORNERS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const
const EPSILON = 0.00001

type GroundPlaneCoverage = {
  centerX: number
  centerZ: number
  width: number
  depth: number
}

type GroundPlaneCoverageScratch = {
  nearPoint: Vector3
  farPoint: Vector3
  rayDirection: Vector3
  intersectionPoint: Vector3
}

export const createGroundPlaneCoverageScratch = (): GroundPlaneCoverageScratch => ({
  nearPoint: new Vector3(),
  farPoint: new Vector3(),
  rayDirection: new Vector3(),
  intersectionPoint: new Vector3(),
})

export const computeGroundPlaneCoverage = (
  camera: OrthographicCamera,
  planeY: number,
  scratch: GroundPlaneCoverageScratch = createGroundPlaneCoverageScratch()
): GroundPlaneCoverage | null => {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (const [ndcX, ndcY] of NDC_CORNERS) {
    scratch.nearPoint.set(ndcX, ndcY, -1).unproject(camera)
    scratch.farPoint.set(ndcX, ndcY, 1).unproject(camera)
    scratch.rayDirection.copy(scratch.farPoint).sub(scratch.nearPoint)

    if (Math.abs(scratch.rayDirection.y) <= EPSILON) {
      return null
    }

    const t = (planeY - scratch.nearPoint.y) / scratch.rayDirection.y
    if (!Number.isFinite(t)) {
      return null
    }

    scratch.intersectionPoint.copy(scratch.nearPoint).addScaledVector(scratch.rayDirection, t)

    minX = Math.min(minX, scratch.intersectionPoint.x)
    maxX = Math.max(maxX, scratch.intersectionPoint.x)
    minZ = Math.min(minZ, scratch.intersectionPoint.z)
    maxZ = Math.max(maxZ, scratch.intersectionPoint.z)
  }

  if (![minX, maxX, minZ, maxZ].every(value => Number.isFinite(value))) {
    return null
  }

  return {
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    width: Math.max(maxX - minX, EPSILON),
    depth: Math.max(maxZ - minZ, EPSILON),
  }
}

type BackgroundPlaneProps = {
  parchmentSeed?: number
}

export const BackgroundPlane: React.FC<BackgroundPlaneProps> = ({ parchmentSeed = 0 }) => {
  const material = useMemo(() => createParchmentMaterial(), [])
  const meshRef = useRef<Mesh>(null)
  const coverageScratch = useMemo(() => createGroundPlaneCoverageScratch(), [])

  useEffect(() => {
    applyParchmentUniforms(material, JESS_PREFERENCE_PARCHMENT_PARAMS, {
      seed: parchmentSeed,
      edgeStrength: 0,
      edgeWidth: 0.04,
      highlightStrength: 0,
    })
  }, [material, parchmentSeed])

  useEffect(() => {
    return () => {
      material.dispose()
    }
  }, [material])

  useFrame(({ camera }) => {
    if (!(camera instanceof OrthographicCamera)) {
      return
    }

    // Keep matrixWorld in sync with the latest camera pose before coverage math.
    // This avoids stale one-frame coverage on wheel zoom in demand-driven render loops.
    camera.updateMatrixWorld(true)

    const mesh = meshRef.current
    if (!mesh) {
      return
    }

    const coverage = computeGroundPlaneCoverage(camera, BACKGROUND_PLANE_Y, coverageScratch)
    if (!coverage) {
      return
    }

    mesh.position.set(coverage.centerX, BACKGROUND_PLANE_Y, coverage.centerZ)
    mesh.scale.set(coverage.width * BACKGROUND_OVERSCAN, coverage.depth * BACKGROUND_OVERSCAN, 1)
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, BACKGROUND_PLANE_Y, 0]}
      receiveShadow
    >
      <planeGeometry args={[1, 1]} />
      <primitive attach='material' object={material} />
    </mesh>
  )
}
