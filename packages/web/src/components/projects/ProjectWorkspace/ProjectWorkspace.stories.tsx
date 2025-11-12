import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'

// Create a simplified workspace component for Storybook that doesn't need LiveStore
const ProjectWorkspaceStory = ({
  projectName = 'Sample Project',
  projectDescription = 'This is a sample project description that shows how the workspace displays project information with tabs and breadcrumb navigation.',
  hasDescription = true,
}: {
  projectName?: string
  projectDescription?: string
  hasDescription?: boolean
}) => {
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'documents'>('tasks')

  return (
    <div className='h-screen bg-white flex flex-col'>
      {/* Project Header with Breadcrumb */}
      <div className='border-b border-gray-200 bg-white px-6 py-4'>
        <div className='flex items-center gap-4 mb-3'>
          <button
            className='flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors'
            aria-label='Back to projects'
          >
            <svg
              className='w-4 h-4 text-gray-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>

          {/* Breadcrumb */}
          <nav className='flex items-center text-sm text-gray-500'>
            <button className='hover:text-gray-700 transition-colors'>Projects</button>
            <svg className='w-4 h-4 mx-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
            <span className='text-gray-900 font-medium'>{projectName}</span>
          </nav>
        </div>

        {/* Project Title and Description */}
        <div className='mb-4'>
          <h1 className='text-xl font-semibold text-gray-900 mb-1'>{projectName}</h1>
          {hasDescription && <p className='text-gray-600 text-sm'>{projectDescription}</p>}
        </div>

        {/* Tab Navigation */}
        <div className='flex border-b border-gray-200 -mb-px'>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            disabled
            className='px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-400 cursor-not-allowed'
            title='Documents tab coming in Phase 1.2'
          >
            Documents
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className='flex-1 overflow-hidden'>
        {activeTab === 'tasks' && (
          <div className='flex h-full overflow-x-auto p-6 gap-6 pb-6'>
            {/* Sample Kanban Columns */}
            <div className='flex-shrink-0 w-80'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-medium text-gray-900 mb-3'>Todo</h3>
                <div className='space-y-2'>
                  <div className='bg-white p-3 rounded-md shadow-sm border'>
                    <h4 className='font-medium text-sm'>Sample Task 1</h4>
                    <p className='text-xs text-gray-500 mt-1'>Sample task description</p>
                  </div>
                  <div className='bg-white p-3 rounded-md shadow-sm border'>
                    <h4 className='font-medium text-sm'>Sample Task 2</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex-shrink-0 w-80'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-medium text-gray-900 mb-3'>Doing</h3>
                <div className='space-y-2'>
                  <div className='bg-white p-3 rounded-md shadow-sm border'>
                    <h4 className='font-medium text-sm'>In Progress Task</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex-shrink-0 w-80'>
              <div className='bg-gray-50 rounded-lg p-4'>
                <h3 className='font-medium text-gray-900 mb-3'>Done</h3>
                <div className='space-y-2'>
                  <div className='bg-white p-3 rounded-md shadow-sm border'>
                    <h4 className='font-medium text-sm'>Completed Task</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className='flex items-center justify-center h-full text-gray-500'>
            <div className='text-center'>
              <svg
                className='w-12 h-12 mx-auto mb-4 text-gray-300'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={1.5}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <p className='text-lg font-medium mb-1'>Documents Coming Soon</p>
              <p className='text-sm'>Document management will be available in Phase 1.2</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const meta: Meta<typeof ProjectWorkspaceStory> = {
  title: 'Components/ProjectWorkspace',
  component: ProjectWorkspaceStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Project workspace that shows tasks in Kanban view with tabbed interface. Includes breadcrumb navigation, project description display, and preparation for future document integration.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    projectName: {
      control: 'text',
      description: 'Name of the project displayed in header and breadcrumb',
    },
    projectDescription: {
      control: 'text',
      description: 'Project description shown below the title',
    },
    hasDescription: {
      control: 'boolean',
      description: 'Whether to show the project description',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    projectName: 'Website Redesign',
    projectDescription:
      'Complete redesign of the company website with modern UI/UX principles and improved user experience.',
    hasDescription: true,
  },
}

export const WithoutDescription: Story = {
  args: {
    projectName: 'Mobile App Development',
    hasDescription: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Project workspace without a description - shows cleaner header layout.',
      },
    },
  },
}

export const LongProjectName: Story = {
  args: {
    projectName: 'Enterprise Customer Relationship Management System Migration',
    projectDescription:
      'Migration of legacy CRM system to modern cloud-based solution with enhanced features for customer tracking, sales pipeline management, and automated reporting capabilities.',
    hasDescription: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the workspace handles longer project names and descriptions.',
      },
    },
  },
}

export const TabNavigation: Story = {
  args: {
    projectName: 'Product Documentation',
    projectDescription:
      'Comprehensive documentation portal for all product features and API references.',
    hasDescription: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the tabbed interface with Tasks tab active and Documents tab prepared for Phase 1.2. Try clicking between the tabs to see the navigation in action.',
      },
    },
  },
}
