import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { BuildingOverlay } from './BuildingOverlay.js'

const meta: Meta<typeof BuildingOverlay> = {
  title: 'Layout/BuildingOverlay',
  component: BuildingOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    title: 'Workshop',
    onClose: () => {},
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const MapBackdrop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='relative h-dvh w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#fff8ec_0%,#efe2cd_45%,#d9c5a8_100%)]'>
      <div className='absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),rgba(0,0,0,0.05))]' />
      <div className='absolute inset-0'>{children}</div>
    </div>
  )
}

export const DefaultFrame: Story = {
  render: args => (
    <MapBackdrop>
      <BuildingOverlay {...args}>
        <h2 className='text-xl font-semibold text-[#2f2b27]'>Workshop</h2>
        <p className='mt-3 text-sm text-[#5f4a36]'>
          A reusable frame for room overlays rendered above the map surface.
        </p>
      </BuildingOverlay>
    </MapBackdrop>
  ),
}

export const LongScrollContent: Story = {
  render: args => (
    <MapBackdrop>
      <BuildingOverlay {...args} title='Project Board'>
        <h2 className='text-xl font-semibold text-[#2f2b27]'>Project Board</h2>
        <div className='mt-4 space-y-3 text-sm text-[#5f4a36]'>
          {Array.from({ length: 18 }).map((_, index) => (
            <p key={index}>
              Section {index + 1}: Overlay content scrolls within the panel while the map remains
              visible and dimmed behind it.
            </p>
          ))}
        </div>
      </BuildingOverlay>
    </MapBackdrop>
  ),
}

export const MobileViewport: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: args => (
    <MapBackdrop>
      <BuildingOverlay {...args} title='Sanctuary'>
        <h2 className='text-lg font-semibold text-[#2f2b27]'>Sanctuary</h2>
        <p className='mt-3 text-sm text-[#5f4a36]'>
          The frame scales to smaller screens while preserving close affordances and scrolling.
        </p>
      </BuildingOverlay>
    </MapBackdrop>
  ),
}
