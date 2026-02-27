import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { AttendantRail } from './AttendantRail.js'
import type { AttendantId } from './AttendantRailProvider.js'

const Frame: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='relative h-dvh w-full bg-[radial-gradient(circle_at_20%_20%,#fff8ec_0%,#efe2cd_45%,#d9c5a8_100%)]'>
      {children}
    </div>
  )
}

const InteractiveRail: React.FC<{
  initialActiveAttendantId?: AttendantId | null
  notifications?: Partial<Record<AttendantId, boolean>>
}> = ({ initialActiveAttendantId = null, notifications }) => {
  const [activeAttendantId, setActiveAttendantId] = React.useState<AttendantId | null>(
    initialActiveAttendantId
  )

  return (
    <Frame>
      <AttendantRail
        activeAttendantId={activeAttendantId}
        notifications={notifications}
        onAttendantClick={id => {
          setActiveAttendantId(current => (current === id ? null : id))
        }}
      />
    </Frame>
  )
}

const meta: Meta<typeof AttendantRail> = {
  title: 'Layout/AttendantRail',
  component: AttendantRail,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    activeAttendantId: null,
    onAttendantClick: () => {},
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <InteractiveRail />,
}

export const JarvisSelected: Story = {
  render: () => <InteractiveRail initialActiveAttendantId='jarvis' />,
}

export const MarvinSelected: Story = {
  render: () => <InteractiveRail initialActiveAttendantId='marvin' />,
}

export const WithNotificationPips: Story = {
  render: () => <InteractiveRail notifications={{ jarvis: true, marvin: true }} />,
}
