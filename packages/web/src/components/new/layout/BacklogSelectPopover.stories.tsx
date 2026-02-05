import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { BacklogSelectPopover, type BacklogItem } from './BacklogSelectPopover.js'

const sampleGoldItems: BacklogItem[] = [
  { id: '1', name: 'Launch new product line', meta: 'growth' },
  { id: '2', name: 'Expand to European market', meta: 'growth' },
  { id: '3', name: 'Build mobile app', meta: 'technology' },
]

const sampleSilverItems: BacklogItem[] = [
  { id: '1', name: 'Improve CI/CD pipeline', meta: 'technology' },
  { id: '2', name: 'Automate onboarding flow', meta: 'operations' },
  { id: '3', name: 'Optimize database queries', meta: 'technology' },
  { id: '4', name: 'Set up monitoring alerts', meta: 'technology' },
  { id: '5', name: 'Refactor authentication module', meta: 'technology' },
]

// Interactive wrapper that manages popover state
// Note: Router is provided by Storybook's preview.tsx (BrowserRouter)
function PopoverWrapper({ stream, items }: { stream: 'gold' | 'silver'; items: BacklogItem[] }) {
  const [isOpen, setIsOpen] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div className='relative w-[280px] p-4 bg-gray-50'>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className='w-full p-3 border border-[#e8e4de] rounded-xl bg-white text-left'
      >
        <div className='text-sm text-[#8b8680]'>
          {selected ? `Selected: ${selected}` : 'Click to open popover'}
        </div>
      </button>
      <BacklogSelectPopover
        stream={stream}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelect={id => {
          setSelected(id)
          setIsOpen(false)
        }}
        items={items}
      />
    </div>
  )
}

const meta: Meta<typeof PopoverWrapper> = {
  title: 'New UI/Layout/BacklogSelectPopover',
  component: PopoverWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A popover for selecting backlog projects to activate on The Table. Used in empty Gold and Silver slots.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const GoldWithItems: Story = {
  args: {
    stream: 'gold',
    items: sampleGoldItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Gold stream popover with available initiative projects.',
      },
    },
  },
}

export const SilverWithItems: Story = {
  args: {
    stream: 'silver',
    items: sampleSilverItems,
  },
  parameters: {
    docs: {
      description: {
        story: 'Silver stream popover with available optimization projects.',
      },
    },
  },
}

export const EmptyState: Story = {
  args: {
    stream: 'gold',
    items: [],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Empty state when no backlog projects are available. Shows a link to create a new project.',
      },
    },
  },
}

export const ManyItems: Story = {
  args: {
    stream: 'silver',
    items: [
      ...sampleSilverItems,
      { id: '6', name: 'Implement rate limiting', meta: 'technology' },
      { id: '7', name: 'Add logging infrastructure', meta: 'technology' },
      { id: '8', name: 'Create admin dashboard', meta: 'operations' },
      { id: '9', name: 'Set up A/B testing framework', meta: 'growth' },
      { id: '10', name: 'Migrate to new hosting provider', meta: 'technology' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'Popover with many items shows scrolling behavior.',
      },
    },
  },
}
