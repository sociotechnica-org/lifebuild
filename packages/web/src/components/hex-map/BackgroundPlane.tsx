import React, { useEffect, useMemo } from 'react'
import {
  JESS_PREFERENCE_PARCHMENT_PARAMS,
  applyParchmentUniforms,
  createParchmentMaterial,
} from './shaders/parchmentShader.js'

type BackgroundPlaneProps = {
  parchmentSeed?: number
}

export const BackgroundPlane: React.FC<BackgroundPlaneProps> = ({ parchmentSeed = 0 }) => {
  const material = useMemo(() => createParchmentMaterial(), [])

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

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[42, 42]} />
      <primitive attach='material' object={material} />
    </mesh>
  )
}
