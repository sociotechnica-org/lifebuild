import React from 'react'
import {
  SANCTUARY_WHITE,
  WARM_STONE,
  SOFT_PLATINUM,
  DEEP_EARTH,
  CLAY_BROWN,
  SHADOW_LEVEL_2,
} from '../../styles/colors.js'

/**
 * WorkSquaredLogo - 3D scrabble tile with warm wood tones
 *
 * A 60x60 tile with visible warm wood grain texture.
 * Warmer tan/beige base with brown undertones.
 */
export const WorkSquaredLogo: React.FC = () => {
  return (
    <div
      className='relative w-[60px] h-[60px] rounded-md'
      style={{
        boxShadow: SHADOW_LEVEL_2,
      }}
    >
      {/* Base warm wood grain - more tan/beige */}
      <div
        className='absolute inset-0 rounded-md'
        style={{
          background: `
            linear-gradient(135deg,
              rgba(160, 130, 90, 0.15) 0%,
              rgba(210, 180, 140, 0.08) 50%,
              rgba(160, 130, 90, 0.15) 100%
            ),
            linear-gradient(90deg,
              #E5D5B7 0%,
              #D2B48C 25%,
              #E5D5B7 50%,
              #C8B591 75%,
              #E5D5B7 100%
            )
          `,
          backgroundSize: '100% 100%, 200% 100%',
        }}
      />

      {/* Visible wood grain texture */}
      <div
        className='absolute inset-0 rounded-md opacity-40'
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1.5px,
              rgba(139, 105, 70, 0.25) 1.5px,
              rgba(139, 105, 70, 0.25) 3px
            )
          `,
        }}
      />

      {/* Warm light highlight for 3D depth */}
      <div
        className='absolute inset-0 rounded-md'
        style={{
          background: `linear-gradient(180deg, rgba(255, 250, 240, 0.6) 0%, transparent 40%)`,
        }}
      />

      {/* Warm shadow for depth */}
      <div
        className='absolute inset-0 rounded-md'
        style={{
          background: `linear-gradient(180deg, transparent 60%, rgba(101, 67, 33, 0.3) 100%)`,
        }}
      />

      {/* Border with warm brown tone */}
      <div
        className='absolute inset-0 rounded-md'
        style={{
          border: `1px solid rgba(139, 105, 70, 0.5)`,
        }}
      />

      {/* Letter content - Deep Earth color */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='relative' style={{ marginTop: '2px' }}>
          <span
            className='font-bold text-[32px] leading-none'
            style={{
              color: DEEP_EARTH,
              textShadow: `1px 1px 2px rgba(255, 250, 240, 0.8)`,
              fontFamily: 'Inter Display, sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            W
          </span>
          <span
            className='absolute font-bold text-[14px] leading-none'
            style={{
              top: '-2px',
              right: '-10px',
              color: DEEP_EARTH,
              textShadow: `0.5px 0.5px 1px rgba(255, 250, 240, 0.8)`,
              fontFamily: 'Inter Display, sans-serif',
            }}
          >
            2
          </span>
        </div>
      </div>
    </div>
  )
}
