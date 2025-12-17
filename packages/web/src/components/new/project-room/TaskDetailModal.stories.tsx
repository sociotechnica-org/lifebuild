import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { useState } from 'react'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { schema, events } from '@lifebuild/shared/schema'
import type { Task } from '@lifebuild/shared/schema'
import { TaskDetailModal } from './TaskDetailModal.js'

const PROJECT_ID = 'modal-project'

// All sample tasks for position calculation in stories
const allSampleTasks: Task[] = []

// Wrapper component to show the modal with a toggle button
function TaskDetailModalDemo({
  initialTask,
  isCreating = false,
  hideStatus = false,
  projectId = PROJECT_ID,
}: {
  initialTask: Task | null
  isCreating?: boolean
  hideStatus?: boolean
  projectId?: string
}) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className='p-8'>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className='px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600'
        >
          {isCreating ? 'Create New Task' : 'Open Modal'}
        </button>
      )}
      {isOpen && (
        <TaskDetailModal
          task={initialTask}
          allTasks={allSampleTasks}
          onClose={() => {
            setIsOpen(false)
          }}
          projectId={projectId}
          isCreating={isCreating}
          hideStatus={hideStatus}
          onTaskCreated={taskId => {
            console.log('Task created:', taskId)
          }}
        />
      )}
    </div>
  )
}

const withModalProviders =
  (boot?: (store: Store) => void) =>
  (Story: React.ComponentType): React.ReactElement => {
    return (
      <LiveStoreProvider
        schema={schema}
        adapter={makeInMemoryAdapter()}
        batchUpdates={batchUpdates}
        boot={store => {
          // Create project
          store.commit(
            events.projectCreatedV2({
              id: PROJECT_ID,
              name: 'Modal Test Project',
              description: 'A project for testing the task modal',
              category: 'growth',
              createdAt: new Date('2024-01-01T00:00:00Z'),
              actorId: 'storybook',
            })
          )
          boot?.(store)
        }}
      >
        <Story />
      </LiveStoreProvider>
    )
  }

// Sample tasks for different story variants
const taskWithDescription: Task = {
  id: 'task-with-desc',
  projectId: PROJECT_ID,
  title: 'Implement user authentication flow',
  description:
    'Create a complete authentication system including login, logout, password reset, and session management. Should integrate with our existing OAuth providers.',
  status: 'doing',
  assigneeIds: '[]',
  attributes: null,
  position: 1000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

const taskWithoutDescription: Task = {
  id: 'task-no-desc',
  projectId: PROJECT_ID,
  title: 'Quick fix for button alignment',
  description: null,
  status: 'todo',
  assigneeIds: '[]',
  attributes: null,
  position: 2000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

const taskInReview: Task = {
  id: 'task-review',
  projectId: PROJECT_ID,
  title: 'Code review: API endpoints',
  description: 'Review the new REST API endpoints for the user management module.',
  status: 'in_review',
  assigneeIds: '[]',
  attributes: null,
  position: 3000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

const taskDone: Task = {
  id: 'task-done',
  projectId: PROJECT_ID,
  title: 'Setup project scaffolding',
  description: 'Initial project setup with TypeScript, ESLint, and Prettier configuration.',
  status: 'done',
  assigneeIds: '[]',
  attributes: null,
  position: 4000,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-03T00:00:00Z'),
  archivedAt: null,
}

const taskLongTitle: Task = {
  id: 'task-long',
  projectId: PROJECT_ID,
  title:
    'Refactor the entire authentication module to support multiple OAuth providers including Google, GitHub, and custom enterprise SSO solutions',
  description:
    'This is a complex task that requires significant architectural changes.\n\n- Support Google OAuth 2.0\n- Support GitHub OAuth\n- Add enterprise SSO via SAML\n- Maintain backwards compatibility\n- Update all existing tests',
  status: 'todo',
  assigneeIds: '[]',
  attributes: null,
  position: 5000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

// Task with deadline - attributes stored as JSON string since that's how it comes from DB
const taskWithDeadline: Task = {
  id: 'task-deadline',
  projectId: PROJECT_ID,
  title: 'Complete quarterly report',
  description: 'Prepare and submit the Q4 quarterly report with all financial data.',
  status: 'todo',
  assigneeIds: '[]',
  // Attributes are stored as JSON string in the database
  attributes:
    `{"deadline":${new Date('2024-12-31T00:00:00Z').getTime()}}` as unknown as Task['attributes'],
  position: 6000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

// Task with deadline in a different year
const taskWithFutureYearDeadline: Task = {
  id: 'task-future-deadline',
  projectId: PROJECT_ID,
  title: 'Plan annual conference',
  description: 'Organize and plan the annual company conference for next year.',
  status: 'todo',
  assigneeIds: '[]',
  // Attributes are stored as JSON string in the database
  attributes:
    `{"deadline":${new Date('2026-06-15T00:00:00Z').getTime()}}` as unknown as Task['attributes'],
  position: 7000,
  createdAt: new Date('2024-01-02T00:00:00Z'),
  updatedAt: new Date('2024-01-02T00:00:00Z'),
  archivedAt: null,
}

const meta: Meta<typeof TaskDetailModalDemo> = {
  title: 'New UI/Project Room/TaskDetailModal',
  component: TaskDetailModalDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Modal for viewing, editing, and creating tasks. Supports title, description, status, and deadline fields. Click "Edit" to enter edit mode, or use creation mode for new tasks.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    initialTask: taskWithDescription,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story: 'Task with title and description. Click "Edit" to modify.',
      },
    },
  },
}

export const NoDescription: Story = {
  args: {
    initialTask: taskWithoutDescription,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story: 'Task without a description shows "No description provided" placeholder.',
      },
    },
  },
}

export const InReview: Story = {
  args: {
    initialTask: taskInReview,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story: 'Task in "In Review" status.',
      },
    },
  },
}

export const Completed: Story = {
  args: {
    initialTask: taskDone,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story: 'Completed task (Done status).',
      },
    },
  },
}

export const LongContent: Story = {
  args: {
    initialTask: taskLongTitle,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story: 'Task with a long title and multi-line description to test text wrapping.',
      },
    },
  },
}

export const WithDeadline: Story = {
  args: {
    initialTask: taskWithDeadline,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story: 'Task with a deadline set. Shows deadline in "Dec 31" format for current year.',
      },
    },
  },
}

export const WithFutureYearDeadline: Story = {
  args: {
    initialTask: taskWithFutureYearDeadline,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Task with a deadline in a future year. Shows deadline in "Jun 15, 2026" format with year.',
      },
    },
  },
}

export const CreationMode: Story = {
  args: {
    initialTask: null,
    isCreating: true,
    projectId: PROJECT_ID,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Task creation mode. Opens directly in edit mode with empty fields. Used when adding new tasks.',
      },
    },
  },
}

export const CreationModeHideStatus: Story = {
  args: {
    initialTask: null,
    isCreating: true,
    hideStatus: true,
    projectId: PROJECT_ID,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Task creation mode with status hidden (used in Stage 3 drafting where all tasks are "todo").',
      },
    },
  },
}

export const EditModeHideStatus: Story = {
  args: {
    initialTask: taskWithDescription,
    hideStatus: true,
  },
  decorators: [withModalProviders()],
  parameters: {
    docs: {
      description: {
        story:
          'Edit mode with status hidden. Status is not displayed or editable (used in Stage 3 drafting).',
      },
    },
  },
}
