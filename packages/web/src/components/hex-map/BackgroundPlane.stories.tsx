import type { Meta, StoryObj } from '@storybook/react'
import { Canvas } from '@react-three/fiber'
import { createHex } from '@lifebuild/shared/hex'
import React from 'react'
import { BackgroundPlane } from './BackgroundPlane.js'
import { CameraRig } from './CameraRig.js'
import { HexCell } from './HexCell.js'

type BackgroundPlanePreviewProps = {
  parchmentSeed?: number
}

const BackgroundPlanePreview: React.FC<BackgroundPlanePreviewProps> = ({
  parchmentSeed = 0.42,
}) => {
  return (
    <div className='h-[420px] w-full'>
      <Canvas
        orthographic
        camera={{ position: [0, 40, 35], zoom: 1, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach='background' args={['#efe2cd']} />
        <ambientLight color='#fff5e6' intensity={0.7} />
        <directionalLight position={[10, 20, 10]} color='#ffe8cc' intensity={0.6} />
        <hemisphereLight color='#c9dde6' groundColor='#d4b896' intensity={0.4} />
        <BackgroundPlane parchmentSeed={parchmentSeed} />
        <CameraRig />
        <HexCell coord={createHex(0, 0)} parchmentSeed={parchmentSeed} />
      </Canvas>
    </div>
  )
}

const meta: Meta<typeof BackgroundPlanePreview> = {
  title: 'Life Map/BackgroundPlane',
  component: BackgroundPlanePreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Parchment shader background using the Jess Preference parameter set from the hex-grid prototype.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BackgroundPlanePreview>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    parchmentSeed: 0.42,
  },
}
