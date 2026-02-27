import type { Meta, StoryObj } from '@storybook/react'
import { Canvas } from '@react-three/fiber'
import { createHex } from '@lifebuild/shared/hex'
import React from 'react'
import { CameraRig } from './CameraRig.js'
import { HexCell } from './HexCell.js'
import { HexTile, type HexTileVisualState, type HexTileWorkstream } from './HexTile.js'

type HexTilePreviewProps = {
  projectName: string
  categoryColor: string
  visualState?: HexTileVisualState
  workstream?: HexTileWorkstream
  isCompleted?: boolean
  isArchived?: boolean
  isSelected?: boolean
}

const HexTilePreview: React.FC<HexTilePreviewProps> = ({
  projectName,
  categoryColor,
  visualState = 'active',
  workstream = null,
  isCompleted = false,
  isArchived = false,
  isSelected = false,
}) => {
  return (
    <div className='h-[340px] w-full'>
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
        <HexCell coord={createHex(0, 0)} />
        <HexTile
          coord={createHex(0, 0)}
          projectName={projectName}
          categoryColor={categoryColor}
          visualState={visualState}
          workstream={workstream}
          isCompleted={isCompleted}
          isArchived={isArchived}
          isSelected={isSelected}
          onClick={() => {}}
        />
      </Canvas>
    </div>
  )
}

const meta: Meta<typeof HexTilePreview> = {
  title: 'Life Map/HexTile',
  component: HexTilePreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Project tile rendered on top of a base hex cell with a placeholder statue sprite, lifecycle styling, and hover tooltip.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HexTilePreview>

export default meta
type Story = StoryObj<typeof meta>

export const ActiveProject: Story = {
  args: {
    projectName: 'Launch life map pilot',
    categoryColor: '#10B981',
    visualState: 'active',
  },
}

export const PlanningProject: Story = {
  args: {
    projectName: 'Sketch summer reset plan',
    categoryColor: '#F97316',
    visualState: 'planning',
  },
}

export const WorkAtHand: Story = {
  args: {
    projectName: 'Ship relational check-in loop',
    categoryColor: '#3B82F6',
    visualState: 'work-at-hand',
    workstream: 'gold',
  },
}

export const SilverTier: Story = {
  args: {
    projectName: 'Refine project intake process',
    categoryColor: '#22C55E',
    visualState: 'active',
    workstream: 'silver',
  },
}

export const BronzeTier: Story = {
  args: {
    projectName: 'Stabilize weekly review routine',
    categoryColor: '#F97316',
    visualState: 'active',
    workstream: 'bronze',
  },
}

export const CompletedProject: Story = {
  args: {
    projectName: 'Finish tax filing workflow',
    categoryColor: '#3B82F6',
    visualState: 'completed',
    isCompleted: true,
  },
}

export const ArchivedProject: Story = {
  args: {
    projectName: 'Retired migration experiment',
    categoryColor: '#3B82F6',
    visualState: 'active',
    isArchived: true,
  },
}

export const SelectedForRemoval: Story = {
  args: {
    projectName: 'Rework weekly planning cadence',
    categoryColor: '#c48b5a',
    isCompleted: false,
    isSelected: true,
  },
}
