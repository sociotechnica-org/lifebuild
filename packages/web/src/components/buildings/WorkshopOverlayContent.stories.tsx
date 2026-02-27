import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { WorkshopOverlayContent } from './WorkshopOverlayContent.js'
import { BuildingOverlay } from '../layout/BuildingOverlay.js'

const meta: Meta<typeof WorkshopOverlayContent> = {
  title: 'Buildings/WorkshopOverlayContent',
  component: WorkshopOverlayContent,
  parameters: {
    layout: 'fullscreen',
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

export const Default: Story = {
  render: () => <WorkshopOverlayContent />,
}

export const InBuildingOverlayFrame: Story = {
  render: () => (
    <MapBackdrop>
      <BuildingOverlay title='Workshop' onClose={() => {}}>
        <WorkshopOverlayContent />
      </BuildingOverlay>
    </MapBackdrop>
  ),
}
