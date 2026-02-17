import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { hexToWorld } from '../hex/math.js'
import { useGameState } from '../store/gameState.js'

const HEX_SIZE = 1.0
const MOVE_SPEED = 4.0
const UNIT_Y = 0.5

export function Unit() {
  const meshRef = useRef<THREE.Mesh>(null)

  const unitPosition = useGameState(s => s.unitPosition)
  const unitPath = useGameState(s => s.unitPath)
  const isMoving = useGameState(s => s.isMoving)
  const currentPathIndex = useGameState(s => s.currentPathIndex)
  const advancePath = useGameState(s => s.advancePath)
  const finishMove = useGameState(s => s.finishMove)

  // Set initial position
  useEffect(() => {
    if (meshRef.current && !isMoving) {
      const [x, z] = hexToWorld(unitPosition, HEX_SIZE)
      meshRef.current.position.set(x, UNIT_Y, z)
    }
  }, [unitPosition, isMoving])

  useFrame((_, delta) => {
    if (!meshRef.current || !isMoving) return

    const targetCoord = unitPath[currentPathIndex]
    if (!targetCoord) {
      finishMove(unitPath[unitPath.length - 1]!)
      return
    }

    const [tx, tz] = hexToWorld(targetCoord, HEX_SIZE)
    const target = new THREE.Vector3(tx, UNIT_Y, tz)
    const pos = meshRef.current.position
    const dist = pos.distanceTo(target)

    if (dist < 0.05) {
      pos.copy(target)
      if (currentPathIndex < unitPath.length - 1) {
        advancePath()
      } else {
        finishMove(targetCoord)
      }
    } else {
      const dir = target.clone().sub(pos).normalize()
      pos.add(dir.multiplyScalar(Math.min(MOVE_SPEED * delta, dist)))
    }
  })

  return (
    <mesh ref={meshRef} position={[0, UNIT_Y, 0]}>
      <boxGeometry args={[0.6, 0.6, 0.6]} />
      <meshStandardMaterial color='#c27a3a' roughness={1} metalness={0} />
    </mesh>
  )
}
