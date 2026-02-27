import React, { useMemo } from 'react'

type ProjectSpriteVisualState = 'planning' | 'active' | 'work-at-hand' | 'completed'
type ProjectSpriteWorkstream = 'gold' | 'silver' | 'bronze' | null

type ProjectSpriteProps = {
  visualState: ProjectSpriteVisualState
  workstream?: ProjectSpriteWorkstream
  isArchived?: boolean
}

const TIER_BORDER_COLORS = {
  gold: '#d4a53c',
  silver: '#a0a0a0',
  bronze: '#cd7f32',
} as const

const DEFAULT_BORDER_COLOR = '#8f826f'
const BASE_BODY_COLOR = '#c68d57'
const BASE_ROOF_COLOR = '#8e5f3f'
const BASE_ACCENT_COLOR = '#f1d2aa'

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value))
}

const parseHexColor = (color: string): [number, number, number] => {
  const normalized = color.trim().replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return [139, 134, 128]
  }

  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  return [red, green, blue]
}

const toHexColor = ([red, green, blue]: [number, number, number]): string => {
  return `#${[red, green, blue]
    .map(value => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`
}

const mixHexColors = (base: string, target: string, weight: number): string => {
  const ratio = clamp(weight, 0, 1)
  const [baseR, baseG, baseB] = parseHexColor(base)
  const [targetR, targetG, targetB] = parseHexColor(target)

  return toHexColor([
    baseR + (targetR - baseR) * ratio,
    baseG + (targetG - baseG) * ratio,
    baseB + (targetB - baseB) * ratio,
  ])
}

export const ProjectSprite: React.FC<ProjectSpriteProps> = ({
  visualState,
  workstream = null,
  isArchived = false,
}) => {
  const isInactiveState = visualState === 'completed' || isArchived
  const isPlanningState = visualState === 'planning'
  const desaturateWeight = isInactiveState ? 0.68 : isPlanningState ? 0.32 : 0
  const opacity = isInactiveState ? 0.78 : isPlanningState ? 0.9 : 1

  const bodyColor = useMemo(
    () => mixHexColors(BASE_BODY_COLOR, '#9b958d', desaturateWeight),
    [desaturateWeight]
  )
  const roofColor = useMemo(
    () => mixHexColors(BASE_ROOF_COLOR, '#88827a', desaturateWeight),
    [desaturateWeight]
  )
  const accentColor = useMemo(
    () => mixHexColors(BASE_ACCENT_COLOR, '#b0aaa3', desaturateWeight),
    [desaturateWeight]
  )
  const borderColor = workstream ? TIER_BORDER_COLORS[workstream] : DEFAULT_BORDER_COLOR
  const borderEmissiveIntensity = visualState === 'work-at-hand' ? 0.08 : 0.02

  return (
    <group position={[0, 0.28, 0.06]} rotation={[-0.52, 0, 0]}>
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[0.56, 0.34, 0.44]} />
        <meshStandardMaterial
          color={borderColor}
          emissive={borderColor}
          emissiveIntensity={borderEmissiveIntensity}
          roughness={0.6}
          metalness={0.08}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[0.46, 0.28, 0.34]} />
        <meshStandardMaterial
          color={bodyColor}
          roughness={0.55}
          metalness={0.14}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <boxGeometry args={[0.38, 0.12, 0.28]} />
        <meshStandardMaterial
          color={roofColor}
          roughness={0.55}
          metalness={0.18}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, 0.17, 0.19]}>
        <boxGeometry args={[0.16, 0.14, 0.02]} />
        <meshStandardMaterial
          color={accentColor}
          roughness={0.45}
          metalness={0.04}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
    </group>
  )
}
