import type { Meta, StoryObj } from '@storybook/react'
import { WorkspaceSwitcherPresenter } from './WorkspaceSwitcherPresenter.js'
import { AuthInstance } from '@work-squared/shared/auth'

const meta: Meta<typeof WorkspaceSwitcherPresenter> = {
  title: 'Components/WorkspaceSwitcherPresenter',
  component: WorkspaceSwitcherPresenter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Presenter component for workspace switching. Allows users to view, switch, create, rename, set default, and delete workspaces.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onSwitchWorkspace: { action: 'switch workspace' },
    onCreateWorkspace: { action: 'create workspace' },
    onRenameWorkspace: { action: 'rename workspace' },
    onSetDefaultWorkspace: { action: 'set default workspace' },
    onDeleteWorkspace: { action: 'delete workspace' },
  },
} satisfies Meta<typeof WorkspaceSwitcherPresenter>

export default meta
type Story = StoryObj<typeof meta>

const mockWorkspaces: AuthInstance[] = [
  {
    id: '1',
    name: 'Personal',
    createdAt: new Date('2024-01-01'),
    lastAccessedAt: new Date('2024-01-15'),
    role: 'owner',
    isDefault: true,
  },
  {
    id: '2',
    name: 'Work',
    createdAt: new Date('2024-01-02'),
    lastAccessedAt: new Date('2024-01-14'),
    role: 'admin',
    isDefault: false,
  },
  {
    id: '3',
    name: 'Side Project',
    createdAt: new Date('2024-01-03'),
    lastAccessedAt: new Date('2024-01-13'),
    role: 'member',
    isDefault: false,
  },
]

export const Default: Story = {
  args: {
    workspaces: mockWorkspaces,
    currentWorkspaceId: '1',
    isLoading: false,
    onSwitchWorkspace: () => {},
    onCreateWorkspace: () => {},
    onRenameWorkspace: () => {},
    onSetDefaultWorkspace: () => {},
    onDeleteWorkspace: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default state with multiple workspaces. Click the button to open the dropdown and explore workspace management features.',
      },
    },
  },
}

export const SingleWorkspace: Story = {
  args: {
    workspaces: [
      {
        id: '1',
        name: 'My Workspace',
        createdAt: new Date('2024-01-01'),
        lastAccessedAt: new Date('2024-01-15'),
        role: 'owner',
        isDefault: true,
      },
    ],
    currentWorkspaceId: '1',
    isLoading: false,
    onSwitchWorkspace: () => {},
    onCreateWorkspace: () => {},
    onRenameWorkspace: () => {},
    onSetDefaultWorkspace: () => {},
    onDeleteWorkspace: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'User with only one workspace. The delete button is hidden for the current workspace.',
      },
    },
  },
}

export const ManyWorkspaces: Story = {
  args: {
    workspaces: Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Workspace ${i + 1}`,
      createdAt: new Date(2024, 0, i + 1), // Month is 0-indexed, so 0 = January
      lastAccessedAt: new Date(2024, 0, 10 + i),
      role: (i === 0 ? 'owner' : i < 3 ? 'admin' : 'member') as 'owner' | 'admin' | 'member',
      isDefault: i === 0,
    })),
    currentWorkspaceId: '1',
    isLoading: false,
    onSwitchWorkspace: () => {},
    onCreateWorkspace: () => {},
    onRenameWorkspace: () => {},
    onSetDefaultWorkspace: () => {},
    onDeleteWorkspace: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'User with many workspaces. The dropdown becomes scrollable when there are many items.',
      },
    },
  },
}

export const LongWorkspaceNames: Story = {
  args: {
    workspaces: [
      {
        id: '1',
        name: 'My Personal Workspace with a Very Long Name That Should Truncate',
        createdAt: new Date('2024-01-01'),
        lastAccessedAt: new Date('2024-01-15'),
        role: 'owner',
        isDefault: true,
      },
      {
        id: '2',
        name: 'Work Project - Client A - Marketing Campaign Q1 2024',
        createdAt: new Date('2024-01-02'),
        lastAccessedAt: new Date('2024-01-14'),
        role: 'admin',
        isDefault: false,
      },
    ],
    currentWorkspaceId: '1',
    isLoading: false,
    onSwitchWorkspace: () => {},
    onCreateWorkspace: () => {},
    onRenameWorkspace: () => {},
    onSetDefaultWorkspace: () => {},
    onDeleteWorkspace: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          'Workspaces with long names. Names are truncated in the button but shown in full in the dropdown.',
      },
    },
  },
}

export const Loading: Story = {
  args: {
    workspaces: mockWorkspaces,
    currentWorkspaceId: '1',
    isLoading: true,
    onSwitchWorkspace: () => {},
    onCreateWorkspace: () => {},
    onRenameWorkspace: () => {},
    onSetDefaultWorkspace: () => {},
    onDeleteWorkspace: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Loading state. The button is disabled while a workspace operation is in progress.',
      },
    },
  },
}

export const NoWorkspaces: Story = {
  args: {
    workspaces: [],
    currentWorkspaceId: null,
    isLoading: false,
    onSwitchWorkspace: () => {},
    onCreateWorkspace: () => {},
    onRenameWorkspace: () => {},
    onSetDefaultWorkspace: () => {},
    onDeleteWorkspace: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case: No workspaces available. Shows "Select workspace" placeholder.',
      },
    },
  },
}

export const Interactive: Story = {
  args: {
    workspaces: mockWorkspaces,
    currentWorkspaceId: '1',
    isLoading: false,
    onSwitchWorkspace: (id: string) => {
      console.log('Switch to workspace:', id)
      alert(`Switching to workspace: ${mockWorkspaces.find(w => w.id === id)?.name}`)
    },
    onCreateWorkspace: () => {
      console.log('Create workspace')
      alert('Creating new workspace...')
    },
    onRenameWorkspace: (id: string, name: string) => {
      console.log('Rename workspace:', id, name)
      alert(`Renaming workspace to: ${name}`)
    },
    onSetDefaultWorkspace: (id: string) => {
      console.log('Set default workspace:', id)
      alert(`Setting default workspace: ${mockWorkspaces.find(w => w.id === id)?.name}`)
    },
    onDeleteWorkspace: (id: string) => {
      console.log('Delete workspace:', id)
      alert(`Deleting workspace: ${mockWorkspaces.find(w => w.id === id)?.name}`)
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo. All actions trigger alerts so you can see the interaction flow. Try switching workspaces, renaming, setting default, and deleting.',
      },
    },
  },
}
