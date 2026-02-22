import type { Meta, StoryObj } from '@storybook/react'
import { Canvas } from '@react-three/fiber'
import { createHex } from '@lifebuild/shared/hex'
import React from 'react'
import { CameraRig } from './CameraRig.js'
import { HexCell, type HexCellVisualState } from './HexCell.js'

type HexCellStoryProps = {
  visualStateOverride?: HexCellVisualState
}

const HexCellPreview: React.FC<HexCellStoryProps> = ({ visualStateOverride }) => {
  return (
    <div className='h-[320px] w-full'>
      <Canvas
        orthographic
        camera={{ position: [0, 40, 35], zoom: 1, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach='background' args={['#efe2cd']} />
        <ambientLight color='#fff5e6' intensity={0.7} />
        <directionalLight position={[10, 20, 10]} color='#ffe8cc' intensity={0.6} />
        <hemisphereLight color='#c9dde6' groundColor='#d4b896' intensity={0.4} />
        <CameraRig />
        <HexCell coord={createHex(0, 0)} visualStateOverride={visualStateOverride} />
      </Canvas>
    </div>
  )
}

const meta: Meta<typeof HexCellPreview> = {
  title: 'Life Map/HexCell',
  component: HexCellPreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Single hex cell used by the map shell. Hover story uses a fixed visual override to show highlight treatment.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HexCellPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    visualStateOverride: 'default',
  },
}

export const Hovered: Story = {
  args: {
    visualStateOverride: 'hover',
  },
}

export const Placeable: Story = {
  args: {
    visualStateOverride: 'placeable',
  },
}

export const Blocked: Story = {
  args: {
    visualStateOverride: 'blocked',
  },
}

export const Targeted: Story = {
  args: {
    visualStateOverride: 'targeted',
  },
}
