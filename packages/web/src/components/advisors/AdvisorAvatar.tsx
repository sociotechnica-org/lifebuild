import React from 'react'
import {
  PURPOSEFUL_BLUE,
  CALM_TEAL,
  SOFT_PURPLE,
  SANCTUARY_WHITE,
  SHADOW_LEVEL_2,
  SPRING_EASING,
} from '../../styles/colors.js'

export interface AdvisorAvatarProps {
  initials: string
  color?: 'blue' | 'teal' | 'purple'
  isSelected?: boolean
  size?: 'sm' | 'md' | 'lg'
}

/**
 * AdvisorAvatar - Geometric AI character for Advisors
 *
 * Features the LifeSquared character system:
 * - Rounded rectangular body with circular head
 * - Gap between head and body (whimsical touch)
 * - Large expressive eyes (30-40% of head)
 * - Small upward triangle suggesting elevated thinking
 * - Contemplative color palette
 * - Thin, refined border
 */
export const AdvisorAvatar: React.FC<AdvisorAvatarProps> = ({
  initials,
  color = 'blue',
  isSelected = false,
  size = 'md',
}) => {
  const colorMap = {
    blue: PURPOSEFUL_BLUE,
    teal: CALM_TEAL,
    purple: SOFT_PURPLE,
  }

  const sizeMap = {
    sm: { container: 48, head: 28, body: 36, eye: 8, gap: 2, peak: 4 },
    md: { container: 56, head: 32, body: 42, eye: 10, gap: 2, peak: 5 },
    lg: { container: 64, head: 36, body: 48, eye: 12, gap: 3, peak: 6 },
  }

  const dimensions = sizeMap[size]
  const bgColor = colorMap[color]

  return (
    <div
      className='relative flex flex-col items-center justify-center transition-all'
      style={{
        width: dimensions.container,
        height: dimensions.container,
        transform: isSelected ? 'scale(1.1)' : 'scale(1.0)',
        transition: `transform 250ms ${SPRING_EASING}`,
      }}
    >
      {/* Selected glow */}
      {isSelected && (
        <div
          className='absolute inset-0 rounded-full pointer-events-none'
          style={{
            boxShadow: `0 0 20px ${bgColor}60`,
          }}
        />
      )}

      {/* Peak on top - subtle triangle suggesting elevated thinking */}
      <div
        className='absolute'
        style={{
          top: 2,
          width: 0,
          height: 0,
          borderLeft: `${dimensions.peak}px solid transparent`,
          borderRight: `${dimensions.peak}px solid transparent`,
          borderBottom: `${dimensions.peak}px solid ${bgColor}`,
        }}
      />

      {/* Head - circular */}
      <div
        className='relative rounded-full flex items-center justify-center'
        style={{
          width: dimensions.head,
          height: dimensions.head,
          backgroundColor: bgColor,
          border: `1.5px solid ${bgColor}`,
          boxShadow: SHADOW_LEVEL_2,
        }}
      >
        {/* Eyes - large circles with highlight dots */}
        <div className='flex gap-1.5'>
          <div
            className='rounded-full relative'
            style={{
              width: dimensions.eye,
              height: dimensions.eye,
              backgroundColor: SANCTUARY_WHITE,
            }}
          >
            {/* Highlight dot */}
            <div
              className='absolute rounded-full'
              style={{
                width: dimensions.eye * 0.3,
                height: dimensions.eye * 0.3,
                top: '20%',
                left: '20%',
                backgroundColor: `${bgColor}40`,
              }}
            />
          </div>
          <div
            className='rounded-full relative'
            style={{
              width: dimensions.eye,
              height: dimensions.eye,
              backgroundColor: SANCTUARY_WHITE,
            }}
          >
            {/* Highlight dot */}
            <div
              className='absolute rounded-full'
              style={{
                width: dimensions.eye * 0.3,
                height: dimensions.eye * 0.3,
                top: '20%',
                left: '20%',
                backgroundColor: `${bgColor}40`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Gap - whimsical space between head and body */}
      <div style={{ height: dimensions.gap }} />

      {/* Body - rounded rectangular */}
      <div
        className='relative rounded-xl flex items-center justify-center'
        style={{
          width: dimensions.body,
          height: dimensions.body * 0.8,
          backgroundColor: bgColor,
          border: `1.5px solid ${bgColor}`,
          boxShadow: SHADOW_LEVEL_2,
        }}
      >
        {/* Initials */}
        <span
          className='font-bold'
          style={{
            color: SANCTUARY_WHITE,
            fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px',
            fontFamily: 'Inter Display, sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          {initials}
        </span>
      </div>
    </div>
  )
}
