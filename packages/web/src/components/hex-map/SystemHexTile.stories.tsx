import type { Meta, StoryObj } from '@storybook/react'
import { Canvas } from '@react-three/fiber'
import { createHex } from '@lifebuild/shared/hex'
import React from 'react'
import { CameraRig } from './CameraRig.js'
import { HexCell } from './HexCell.js'
import { SystemHexTile } from './SystemHexTile.js'

type SystemHexTilePreviewProps = {
  systemName: string
  categoryColor: string
  lifecycleState: 'planted' | 'hibernating'
  isSelected?: boolean
}

const SystemHexTilePreview: React.FC<SystemHexTilePreviewProps> = ({
  systemName,
  categoryColor,
  lifecycleState,
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
        <SystemHexTile
          coord={createHex(0, 0)}
          systemName={systemName}
          categoryColor={categoryColor}
          lifecycleState={lifecycleState}
          isSelected={isSelected}
          onClick={() => {}}
        />
      </Canvas>
    </div>
  )
}

const meta: Meta<typeof SystemHexTilePreview> = {
  title: 'Life Map/SystemHexTile',
  component: SystemHexTilePreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'System tile rendered on the hex map with infinity icon, health dots, and desaturated category color. Visually distinct from project tiles.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SystemHexTilePreview>

export default meta
type Story = StoryObj<typeof meta>

export const PlantedSystem: Story = {
  args: {
    systemName: 'Weekly Review',
    categoryColor: '#10B981',
    lifecycleState: 'planted',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A planted system with green category color. Shows the infinity icon and three green health dots.',
      },
    },
  },
}

export const HibernatingSystem: Story = {
  args: {
    systemName: 'Morning Meditation',
    categoryColor: '#3B82F6',
    lifecycleState: 'hibernating',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A hibernating system with dimmed/muted appearance and reduced opacity. Health dots are grey.',
      },
    },
  },
}

export const SelectedSystem: Story = {
  args: {
    systemName: 'Budget Tracking',
    categoryColor: '#F97316',
    lifecycleState: 'planted',
    isSelected: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'A planted system in selected state with subtle elevation.',
      },
    },
  },
}

export const LongNameSystem: Story = {
  args: {
    systemName: 'Comprehensive Weekly Financial Review and Budget Reconciliation',
    categoryColor: '#EF4444',
    lifecycleState: 'planted',
  },
  parameters: {
    docs: {
      description: {
        story: 'System with a long name - hover to see the truncated label tooltip.',
      },
    },
  },
}
