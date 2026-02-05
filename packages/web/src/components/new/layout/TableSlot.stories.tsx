import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { TableSlot, type Stream } from './TableSlot.js'
import type { BacklogItem } from './BacklogSelectPopover.js'

const sampleGoldBacklog: BacklogItem[] = [
  { id: '1', name: 'Launch new product line', meta: 'growth' },
  { id: '2', name: 'Expand to European market', meta: 'growth' },
]

const sampleSilverBacklog: BacklogItem[] = [
  { id: '1', name: 'Improve CI/CD pipeline', meta: 'technology' },
  { id: '2', name: 'Automate onboarding flow', meta: 'operations' },
]

// Interactive wrapper for slots with backlog selection
function InteractiveSlot({
  stream,
  backlogItems,
}: {
  stream: Stream
  backlogItems?: BacklogItem[]
}) {
  const [selectedProject, setSelectedProject] = useState<{
    id: string
    name: string
    meta?: string
  } | null>(null)

  return (
    <MemoryRouter>
      <div className='w-[280px]'>
        <TableSlot
          stream={stream}
          projectId={selectedProject?.id}
          projectName={selectedProject?.name}
          projectMeta={selectedProject?.meta}
          backlogItems={backlogItems}
          onSelectFromBacklog={id => {
            const item = backlogItems?.find(i => i.id === id)
            if (item) {
              setSelectedProject({ id: item.id, name: item.name, meta: item.meta })
            }
          }}
        />
      </div>
    </MemoryRouter>
  )
}

const meta: Meta<typeof TableSlot> = {
  title: 'New UI/Layout/TableSlot',
  component: TableSlot,
  decorators: [
    Story => (
      <MemoryRouter>
        <div className='w-[280px]'>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A single slot in The Table showing Gold, Silver, or Bronze stream. Empty Gold/Silver slots can be clicked to select from backlog.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof TableSlot>

export const GoldFilled: Story = {
  args: {
    stream: 'gold',
    projectId: 'project-1',
    projectName: 'Launch Mobile App',
    projectMeta: 'growth',
    progress: 0.65,
  },
  parameters: {
    docs: {
      description: {
        story: 'A Gold slot with an active initiative project showing progress.',
      },
    },
  },
}

export const SilverFilled: Story = {
  args: {
    stream: 'silver',
    projectId: 'project-2',
    projectName: 'Improve CI/CD Pipeline',
    projectMeta: 'technology',
    progress: 0.3,
  },
  parameters: {
    docs: {
      description: {
        story: 'A Silver slot with an active optimization project showing progress.',
      },
    },
  },
}

export const BronzeFilled: Story = {
  args: {
    stream: 'bronze',
    projectId: 'project-3',
    projectName: 'Quick Task Project',
    projectMeta: 'home',
    bronzeCount: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'A Bronze slot showing the top project with additional count.',
      },
    },
  },
}

export const GoldEmpty: Story = {
  args: {
    stream: 'gold',
  },
  parameters: {
    docs: {
      description: {
        story: 'An empty Gold slot without backlog selection enabled.',
      },
    },
  },
}

export const BronzeEmpty: Story = {
  args: {
    stream: 'bronze',
  },
  parameters: {
    docs: {
      description: {
        story: 'An empty Bronze slot. Bronze slots do not support inline backlog selection.',
      },
    },
  },
}

export const GoldEmptyWithBacklog: StoryObj<typeof InteractiveSlot> = {
  render: () => <InteractiveSlot stream='gold' backlogItems={sampleGoldBacklog} />,
  parameters: {
    docs: {
      description: {
        story:
          'An empty Gold slot with backlog selection. Click to see available initiatives and select one.',
      },
    },
  },
}

export const SilverEmptyWithBacklog: StoryObj<typeof InteractiveSlot> = {
  render: () => <InteractiveSlot stream='silver' backlogItems={sampleSilverBacklog} />,
  parameters: {
    docs: {
      description: {
        story:
          'An empty Silver slot with backlog selection. Click to see available optimizations and select one.',
      },
    },
  },
}

export const GoldEmptyNoBacklog: StoryObj<typeof InteractiveSlot> = {
  render: () => <InteractiveSlot stream='gold' backlogItems={[]} />,
  parameters: {
    docs: {
      description: {
        story:
          'An empty Gold slot when no backlog projects are available. Shows empty state with link to create project.',
      },
    },
  },
}
