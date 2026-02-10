import React, { useMemo } from 'react'
import type { ProjectLifecycleState } from '@lifebuild/shared'

export type UrushiStage = 'sketch' | 'foundation' | 'color' | 'polish' | 'decoration'

export const lifecycleToUrushiStage = (
  lifecycle: ProjectLifecycleState
): { stage: UrushiStage; progress: number } => {
  switch (lifecycle.status) {
    case 'planning':
      if (lifecycle.stage === 1) return { stage: 'sketch', progress: 0.2 }
      if (lifecycle.stage === 2) return { stage: 'foundation', progress: 0.35 }
      return { stage: 'color', progress: 0.5 }
    case 'backlog':
      // Default to bronze (foundation) when stream is not explicitly set to gold/silver
      return {
        stage:
          lifecycle.stream === 'gold' || lifecycle.stream === 'silver' ? 'polish' : 'foundation',
        progress: 0.7,
      }
    case 'active':
      return { stage: 'polish', progress: 0.82 }
    case 'completed':
      return { stage: 'decoration', progress: 1 }
    default:
      return { stage: 'sketch', progress: 0.2 }
  }
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const normalized = hex.replace('#', '')
  const normalizedHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map(char => char.repeat(2))
          .join('')
      : normalized
  const bigint = Number.parseInt(normalizedHex, 16)
  if (Number.isNaN(bigint)) {
    return { r: 14, g: 165, b: 233 }
  }
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return { r, g, b }
}

const withAlpha = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const mixWithWhite = (hex: string, factor: number) => {
  const { r, g, b } = hexToRgb(hex)
  const mix = (channel: number) => Math.round(channel + (255 - channel) * factor)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

const generateWavePath = (amplitude: number, frequency: number, phase: number) => {
  const height = 140
  const width = 200
  const points: string[] = []

  for (let x = 0; x <= width; x += 12) {
    const y =
      height / 2 +
      Math.sin((x / width) * Math.PI * frequency + phase) * amplitude +
      Math.cos((phase + x) * 0.015) * (amplitude * 0.15)
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }

  return `M ${points.join(' L ')}`
}

const makeOrbs = (progress: number) => {
  return [
    { cx: 40 + progress * 40, cy: 30 + progress * 10, r: 6 + progress * 4, opacity: 0.35 },
    { cx: 150 - progress * 30, cy: 55 + progress * 15, r: 10 + progress * 5, opacity: 0.28 },
    { cx: 110 + progress * 20, cy: 100 - progress * 20, r: 5 + progress * 3, opacity: 0.2 },
  ]
}

interface UrushiVisualProps {
  lifecycle: ProjectLifecycleState
  categoryColor?: string
  className?: string
}

export const UrushiVisual: React.FC<UrushiVisualProps> = ({
  lifecycle,
  categoryColor = '#0ea5e9',
  className,
}) => {
  const visualId = useMemo(() => `urushi-${Math.random().toString(16).slice(2)}`, [])
  const { stage, progress } = useMemo(() => lifecycleToUrushiStage(lifecycle), [lifecycle])

  const palette = useMemo(() => {
    const base = categoryColor || '#c56b45'
    const highlightMix =
      stage === 'sketch'
        ? 0.18
        : stage === 'foundation'
          ? 0.24
          : stage === 'color'
            ? 0.3
            : stage === 'polish'
              ? 0.35
              : 0.45
    return {
      base,
      highlight: mixWithWhite(base, highlightMix),
      stroke: withAlpha(base, 0.75),
      glow: withAlpha(base, 0.1 + progress * 0.1 + (stage === 'decoration' ? 0.05 : 0)),
      accent: withAlpha(base, stage === 'sketch' ? 0.45 : 0.55),
    }
  }, [categoryColor, progress, stage])

  const waves = useMemo(() => {
    const stageBump =
      stage === 'sketch'
        ? 0.7
        : stage === 'foundation'
          ? 0.9
          : stage === 'color'
            ? 1
            : stage === 'polish'
              ? 1.1
              : 1.2
    const amplitude = (8 + progress * 12) * stageBump
    return [
      { path: generateWavePath(amplitude, 2.1, progress * Math.PI), opacity: 0.55 },
      { path: generateWavePath(amplitude * 0.75, 3.4, progress * 1.4), opacity: 0.35 },
      { path: generateWavePath(amplitude * 1.15, 1.6, progress * 0.8), opacity: 0.24 },
    ]
  }, [progress, stage])

  const orbs = useMemo(() => makeOrbs(progress), [progress])
  const completed = lifecycle.status === 'completed'

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-amber-100/70 bg-gradient-to-br from-amber-50 via-stone-50 to-white shadow-inner ${className ?? ''}`}
    >
      <div className='pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply bg-[radial-gradient(circle_at_20%_30%,_rgba(197,107,69,0.35),_transparent_35%),radial-gradient(circle_at_80%_10%,_rgba(120,90,60,0.25),_transparent_30%)]' />
      <svg viewBox='0 0 200 140' role='presentation' aria-hidden='true' className='block w-full'>
        <defs>
          <linearGradient id={`${visualId}-bg`} x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor={mixWithWhite(palette.base, 0.65)} />
            <stop offset='35%' stopColor={withAlpha(palette.base, 0.15)} />
            <stop offset='100%' stopColor={mixWithWhite('#fdf4e3', 0.3)} />
          </linearGradient>
        </defs>

        <rect x='0' y='0' width='200' height='140' fill={`url(#${visualId}-bg)`} />
        <rect x='-20' y='-10' width='240' height='180' fill={withAlpha(palette.glow, 0.8)} />

        {orbs.map((orb, index) => (
          <circle
            key={`${visualId}-orb-${index}`}
            cx={orb.cx}
            cy={orb.cy}
            r={orb.r}
            fill={palette.accent}
            opacity={orb.opacity}
          />
        ))}

        {waves.map((wave, index) => (
          <path
            key={`${visualId}-wave-${index}`}
            d={wave.path}
            fill='none'
            stroke={palette.stroke}
            strokeWidth={2.4 - index * 0.35}
            opacity={wave.opacity}
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        ))}

        <circle
          cx={160}
          cy={30}
          r={10 + progress * 8}
          fill={withAlpha(palette.base, 0.2)}
          stroke={palette.stroke}
          strokeWidth={2}
        />

        {completed && (
          <path
            d='M150 30 L158 40 L176 22'
            fill='none'
            stroke={palette.stroke}
            strokeWidth={3}
            strokeLinecap='round'
          />
        )}
      </svg>
      <div className='pointer-events-none absolute inset-0 mix-blend-overlay opacity-70'>
        <div className='absolute inset-0 bg-gradient-to-tr from-white/40 via-transparent to-white/20' />
      </div>
    </div>
  )
}
