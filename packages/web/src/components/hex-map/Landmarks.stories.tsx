import type { Meta, StoryObj } from '@storybook/react'
import { Canvas } from '@react-three/fiber'
import { generateHexGrid } from '@lifebuild/shared/hex'
import React from 'react'
import { CameraRig } from './CameraRig.js'
import { Campfire } from './Campfire.js'
import { HexCell } from './HexCell.js'
import { Sanctuary } from './Sanctuary.js'

type LandmarksPreviewProps = {
  showCampfire?: boolean
}

const LandmarksPreview: React.FC<LandmarksPreviewProps> = ({ showCampfire = false }) => {
  const cells = generateHexGrid(3)

  return (
    <div className='h-[620px] w-full'>
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
        {cells.map(cell => (
          <HexCell key={cell.key} coord={cell.coord} parchmentSeed={0.42} />
        ))}
        <Sanctuary />
        {showCampfire && <Campfire />}
      </Canvas>
    </div>
  )
}

const meta: Meta<typeof LandmarksPreview> = {
  title: 'Life Map/Landmarks',
  component: LandmarksPreview,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Sanctuary and campfire placeholder landmarks using temporary white-rectangle PNG art.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LandmarksPreview>

export default meta
type Story = StoryObj<typeof meta>

export const SanctuaryOnly: Story = {
  args: {
    showCampfire: false,
  },
}

export const SanctuaryAndCampfire: Story = {
  args: {
    showCampfire: true,
  },
}
