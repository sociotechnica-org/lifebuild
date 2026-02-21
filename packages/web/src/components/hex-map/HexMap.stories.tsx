import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { HexMap } from './HexMap.js'

const meta: Meta<typeof HexMap> = {
  title: 'Life Map/HexMap',
  component: HexMap,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Three.js Life Map shell for PR1. Renders a 3-ring (37 cell) hex grid with fixed orthographic camera.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HexMap>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyGrid: Story = {
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap />
    </div>
  ),
}
