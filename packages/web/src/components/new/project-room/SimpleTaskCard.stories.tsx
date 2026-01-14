import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { DndContext } from '@dnd-kit/core'
import type { Task } from '@lifebuild/shared/schema'
import { SimpleTaskCard } from './SimpleTaskCard.js'

const PROJECT_ID = 'task-card-project'

// Wrapper to provide DndContext for the draggable card
function SimpleTaskCardWrapper({ task }: { task: Task }) {
  return (
    <DndContext>
      <div className='w-64 p-4 bg-gray-100'>
        <SimpleTaskCard task={task} onClick={taskId => console.log('Clicked:', taskId)} />
      </div>
    </DndContext>
  )
}

// Sample task without a deadline
const taskWithoutDeadline: Task = {
  id: 'task-no-deadline',
  projectId: PROJECT_ID,
  title: 'Review design specifications',
  description: 'Review the latest design specs and provide feedback.',
  status: 'todo',
  assigneeIds: '[]',
  attributes: null,
  position: 1000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

// Sample task with a future deadline
const taskWithFutureDeadline: Task = {
  id: 'task-future-deadline',
  projectId: PROJECT_ID,
  title: 'Complete quarterly report',
  description: 'Prepare and submit the Q4 quarterly report.',
  status: 'todo',
  assigneeIds: '[]',
  attributes: { deadline: new Date('2027-03-15T00:00:00Z').getTime() },
  position: 2000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

// Sample task with an overdue deadline (in the past)
const taskWithOverdueDeadline: Task = {
  id: 'task-overdue-deadline',
  projectId: PROJECT_ID,
  title: 'Submit expense report',
  description: 'Submit monthly expense report for reimbursement.',
  status: 'todo',
  assigneeIds: '[]',
  attributes: { deadline: new Date('2024-01-01T00:00:00Z').getTime() },
  position: 3000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

// Sample task with a long title
const taskWithLongTitle: Task = {
  id: 'task-long-title',
  projectId: PROJECT_ID,
  title:
    'Refactor the entire authentication module to support multiple OAuth providers and enterprise SSO',
  description: null,
  status: 'doing',
  assigneeIds: '[]',
  attributes: { deadline: new Date('2027-06-30T00:00:00Z').getTime() },
  position: 4000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

// Sample task with attributes as JSON string (as stored in database)
const taskWithJsonStringDeadline: Task = {
  id: 'task-json-string',
  projectId: PROJECT_ID,
  title: 'Task with JSON string attributes',
  description: 'Tests that deadline works when attributes is a JSON string from the database.',
  status: 'todo',
  assigneeIds: '[]',
  // Attributes stored as JSON string (how it comes from the database)
  attributes:
    `{"deadline":${new Date('2024-06-15T00:00:00Z').getTime()}}` as unknown as Task['attributes'],
  position: 5000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

const meta: Meta<typeof SimpleTaskCardWrapper> = {
  title: 'New UI/Project Room/SimpleTaskCard',
  component: SimpleTaskCardWrapper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A compact task card used in the kanban board. Displays task title and optional due date. Due dates in the past are shown in orange.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    task: taskWithoutDeadline,
  },
  parameters: {
    docs: {
      description: {
        story: 'Task card without a due date. Shows only the task title.',
      },
    },
  },
}

export const WithFutureDueDate: Story = {
  args: {
    task: taskWithFutureDeadline,
  },
  parameters: {
    docs: {
      description: {
        story: 'Task card with a future due date displayed in gray below the title.',
      },
    },
  },
}

export const WithOverdueDueDate: Story = {
  args: {
    task: taskWithOverdueDeadline,
  },
  parameters: {
    docs: {
      description: {
        story: 'Task card with an overdue due date displayed in orange to indicate urgency.',
      },
    },
  },
}

export const LongTitle: Story = {
  args: {
    task: taskWithLongTitle,
  },
  parameters: {
    docs: {
      description: {
        story: 'Task card with a long title that wraps to multiple lines (limited to 2 lines).',
      },
    },
  },
}

export const WithJsonStringAttributes: Story = {
  args: {
    task: taskWithJsonStringDeadline,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Task with attributes stored as a JSON string (as it comes from the database). Tests that the JSON parsing logic works correctly.',
      },
    },
  },
}
