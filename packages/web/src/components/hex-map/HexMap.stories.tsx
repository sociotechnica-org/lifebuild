import type { Meta, StoryObj } from '@storybook/react'
import { createHex } from '@lifebuild/shared/hex'
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

export const WithProjectTiles: Story = {
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap
        tiles={[
          {
            id: 'tile-1',
            coord: createHex(0, 0),
            projectName: 'Launch beta map',
            categoryColor: '#10B981',
          },
          {
            id: 'tile-2',
            coord: createHex(1, -1),
            projectName: 'Complete handbook',
            categoryColor: '#3B82F6',
            isCompleted: true,
          },
        ]}
        unplacedProjects={[
          { id: 'project-3', name: 'Draft onboarding tour', category: 'growth' },
          { id: 'project-4', name: 'Home office refresh', category: 'home' },
        ]}
      />
    </div>
  ),
}
