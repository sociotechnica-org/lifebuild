import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import {
  UnplacedPanel,
  type PanelArchivedProjectItem,
  type PanelCompletedProjectItem,
  type PanelProjectItem,
} from './UnplacedPanel.js'

type UnplacedPanelPreviewProps = {
  startCollapsed?: boolean
  unplacedProjects: PanelProjectItem[]
  completedProjects: PanelCompletedProjectItem[]
  archivedProjects: PanelArchivedProjectItem[]
  placementProject?: PanelProjectItem | null
  selectedPlacedProject?: PanelProjectItem | null
  isSelectingPlacedProject?: boolean
  showRemovalControls?: boolean
}

const UnplacedPanelPreview: React.FC<UnplacedPanelPreviewProps> = ({
  startCollapsed = false,
  unplacedProjects,
  completedProjects,
  archivedProjects,
  placementProject = null,
  selectedPlacedProject = null,
  isSelectingPlacedProject = false,
  showRemovalControls = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(startCollapsed)

  return (
    <div className='relative h-[560px] w-[900px] overflow-hidden rounded-xl border border-[#d8cab3] bg-[#efe2cd]'>
      <UnplacedPanel
        isCollapsed={isCollapsed}
        unplacedProjects={unplacedProjects}
        completedProjects={completedProjects}
        archivedProjects={archivedProjects}
        onToggleCollapsed={() => setIsCollapsed(collapsed => !collapsed)}
        placementProject={placementProject}
        selectedPlacedProject={selectedPlacedProject}
        isSelectingPlacedProject={isSelectingPlacedProject}
        onCancelPlacement={placementProject ? () => {} : undefined}
        onStartSelectingPlacedProject={showRemovalControls ? () => {} : undefined}
        onClearPlacedProjectSelection={showRemovalControls ? () => {} : undefined}
        onRemoveSelectedPlacedProject={showRemovalControls ? () => {} : undefined}
      />
    </div>
  )
}

const meta: Meta<typeof UnplacedPanelPreview> = {
  title: 'Life Map/UnplacedPanel',
  component: UnplacedPanelPreview,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Collapsible side panel listing unplaced projects plus completed/archived access while viewing the map.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UnplacedPanelPreview>

export default meta
type Story = StoryObj<typeof meta>

const defaultCompletedAt = Date.parse('2026-02-01T00:00:00Z')

export const Empty: Story = {
  args: {
    startCollapsed: false,
    unplacedProjects: [],
    completedProjects: [],
    archivedProjects: [],
  },
}

export const WithProjects: Story = {
  args: {
    startCollapsed: false,
    unplacedProjects: [
      { id: 'project-1', name: 'Ship project tile rendering', category: 'growth' },
      { id: 'project-2', name: 'Improve daily mobility routine', category: 'health' },
      { id: 'project-3', name: 'Create monthly budget review ritual', category: 'finances' },
    ],
    completedProjects: [
      {
        id: 'project-4',
        name: 'Finalize website redesign',
        category: 'contribution',
        completedAt: defaultCompletedAt,
      },
    ],
    archivedProjects: [
      {
        id: 'project-5',
        name: 'Old backlog cleanup',
        category: 'home',
        archivedAt: new Date('2026-01-18T00:00:00Z'),
      },
    ],
  },
}

export const LongTitles: Story = {
  args: {
    startCollapsed: false,
    unplacedProjects: [
      {
        id: 'project-6',
        name: 'Design and validate a multi-week relational communication reset experiment',
        category: 'relationships',
      },
      {
        id: 'project-7',
        name: 'Build a full-stack dashboard for quarterly personal operating metrics',
        category: 'growth',
      },
    ],
    completedProjects: [
      {
        id: 'project-8',
        name: 'Ship migration tooling for historical life map data and analytics events',
        category: 'contribution',
        completedAt: Date.parse('2026-01-22T00:00:00Z'),
      },
    ],
    archivedProjects: [],
  },
}

export const PlacementMode: Story = {
  args: {
    startCollapsed: false,
    unplacedProjects: [
      { id: 'project-1', name: 'Ship project tile rendering', category: 'growth' },
      { id: 'project-2', name: 'Improve daily mobility routine', category: 'health' },
    ],
    completedProjects: [],
    archivedProjects: [],
    placementProject: { id: 'project-1', name: 'Ship project tile rendering', category: 'growth' },
    selectedPlacedProject: {
      id: 'project-placed',
      name: 'Quarterly budget review',
      category: 'finances',
    },
    isSelectingPlacedProject: false,
    showRemovalControls: true,
  },
}
