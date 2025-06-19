import type { Meta, StoryObj } from '@storybook/react'
import { BoardCard } from '../components/BoardCard.js'

const meta: Meta<typeof BoardCard> = {
  title: 'Kanban/BoardCard',
  component: BoardCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    board: {
      id: 'board-1',
      name: 'Project Alpha',
      description: 'Main development project for our new product launch',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-15'),
      deletedAt: null,
    },
  },
}

export const RecentlyUpdated: Story = {
  args: {
    board: {
      id: 'board-2',
      name: 'Marketing Campaign',
      description: 'Q4 marketing campaign for product promotion',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
      deletedAt: null,
    },
  },
}

export const LongName: Story = {
  args: {
    board: {
      id: 'board-3',
      name: 'Very Long Project Name That Should Wrap Properly in the Card Layout',
      description: 'Long-term project strategy and feature planning',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-10'),
      deletedAt: null,
    },
  },
}

export const WithoutClickHandler: Story = {
  args: {
    board: {
      id: 'board-4',
      name: 'Static Board',
      description: null,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-05'),
      deletedAt: null,
    },
    onClick: undefined,
  },
}
