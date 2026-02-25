import type { Meta, StoryObj } from '@storybook/react'
import { createHex } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import React from 'react'
import { useState } from 'react'
import { HexMap } from './HexMap.js'
import type { PlacedHexTile, PlacedSystemTile } from './HexGrid.js'
import type { PanelProjectItem, PanelSystemItem } from './UnplacedPanel.js'

const meta: Meta<typeof HexMap> = {
  title: 'Life Map/HexMap',
  component: HexMap,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Three.js Life Map shell. Renders a 3-ring (37 cell) hex grid with project tiles and system tiles.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HexMap>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyGrid: Story = {
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap />
    </div>
  ),
}

export const WithProjectTiles: Story = {
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap
        tiles={[
          {
            id: 'tile-1',
            projectId: 'project-1',
            coord: createHex(0, 0),
            projectName: 'Launch beta map',
            categoryColor: '#10B981',
            category: 'growth',
          },
          {
            id: 'tile-2',
            projectId: 'project-2',
            coord: createHex(1, -1),
            projectName: 'Complete handbook',
            categoryColor: '#3B82F6',
            isCompleted: true,
            category: 'contribution',
          },
        ]}
        unplacedProjects={[
          { id: 'project-3', name: 'Draft onboarding tour', category: 'growth' },
          { id: 'project-4', name: 'Home office refresh', category: 'home' },
        ]}
      />
    </div>
  ),
}

export const WithProjectsAndSystems: Story = {
  render: () => (
    <div className='h-[680px] w-full'>
      <HexMap
        tiles={[
          {
            id: 'tile-1',
            projectId: 'project-1',
            coord: createHex(-1, 0),
            projectName: 'Launch beta map',
            categoryColor: '#10B981',
            category: 'growth',
          },
          {
            id: 'tile-2',
            projectId: 'project-2',
            coord: createHex(1, 0),
            projectName: 'Complete handbook',
            categoryColor: '#3B82F6',
            category: 'contribution',
          },
        ]}
        systemTiles={[
          {
            id: 'sys-tile-1',
            systemId: 'system-1',
            coord: createHex(0, 1),
            systemName: 'Weekly Review',
            categoryColor: '#10B981',
            category: 'growth',
            lifecycleState: 'planted',
          },
          {
            id: 'sys-tile-2',
            systemId: 'system-2',
            coord: createHex(-1, 2),
            systemName: 'Morning Meditation',
            categoryColor: '#8B5CF6',
            category: 'spirituality',
            lifecycleState: 'planted',
          },
          {
            id: 'sys-tile-3',
            systemId: 'system-3',
            coord: createHex(1, 1),
            systemName: 'Budget Tracking',
            categoryColor: '#F97316',
            category: 'finances',
            lifecycleState: 'hibernating',
          },
        ]}
        unplacedProjects={[{ id: 'project-3', name: 'Draft onboarding tour', category: 'growth' }]}
        unplacedSystems={[{ id: 'system-4', name: 'Exercise Routine', category: 'health' }]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Map showing both project tiles and system tiles side by side. System tiles have the infinity icon and health dots. One system is hibernating (dimmed). Unplaced items panel shows both projects and systems.',
      },
    },
  },
}

export const PlacementFlow: Story = {
  render: () => {
    const [tiles, setTiles] = useState<PlacedHexTile[]>([
      {
        id: 'tile-placed-1',
        projectId: 'project-placed-1',
        coord: createHex(-1, 1),
        projectName: 'Daily journaling habit',
        categoryColor: '#c48b5a',
        category: 'growth',
      },
    ])
    const [unplacedProjects, setUnplacedProjects] = useState<PanelProjectItem[]>([
      { id: 'project-unplaced-1', name: 'Sprint planning ritual', category: 'growth' },
      { id: 'project-unplaced-2', name: 'Kitchen cleanup routine', category: 'home' },
    ])

    const handlePlaceProject = (projectId: string, coord: HexCoord) => {
      const project = unplacedProjects.find(currentProject => currentProject.id === projectId)
      if (!project) {
        return
      }

      setTiles(currentTiles => [
        ...currentTiles,
        {
          id: `tile-${projectId}`,
          projectId,
          coord: createHex(coord.q, coord.r),
          projectName: project.name,
          categoryColor: '#10B981',
          category: project.category,
        },
      ])
      setUnplacedProjects(currentProjects =>
        currentProjects.filter(currentProject => currentProject.id !== projectId)
      )
    }

    const handleRemoveProject = (projectId: string) => {
      const tile = tiles.find(currentTile => currentTile.projectId === projectId)
      if (!tile) {
        return
      }

      setTiles(currentTiles =>
        currentTiles.filter(currentTile => currentTile.projectId !== projectId)
      )
      setUnplacedProjects(currentProjects => [
        ...currentProjects,
        { id: projectId, name: tile.projectName, category: tile.category ?? null },
      ])
    }

    return (
      <div className='h-[680px] w-full'>
        <HexMap
          tiles={tiles}
          unplacedProjects={unplacedProjects}
          onPlaceProject={handlePlaceProject}
          onRemovePlacedProject={handleRemoveProject}
        />
      </div>
    )
  },
}

export const SystemPlacementFlow: Story = {
  render: () => {
    const [systemTiles, setSystemTiles] = useState<PlacedSystemTile[]>([])
    const [unplacedSystems, setUnplacedSystems] = useState<PanelSystemItem[]>([
      { id: 'system-1', name: 'Weekly Review', category: 'growth' },
      { id: 'system-2', name: 'Morning Meditation', category: 'spirituality' },
    ])

    const handlePlaceSystem = (systemId: string, coord: HexCoord) => {
      const system = unplacedSystems.find(s => s.id === systemId)
      if (!system) {
        return
      }

      setSystemTiles(currentTiles => [
        ...currentTiles,
        {
          id: `sys-tile-${systemId}`,
          systemId,
          coord: createHex(coord.q, coord.r),
          systemName: system.name,
          categoryColor: '#10B981',
          category: system.category,
          lifecycleState: 'planted' as const,
        },
      ])
      setUnplacedSystems(currentSystems => currentSystems.filter(s => s.id !== systemId))
    }

    return (
      <div className='h-[680px] w-full'>
        <HexMap
          systemTiles={systemTiles}
          unplacedSystems={unplacedSystems}
          onPlaceSystem={handlePlaceSystem}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive system placement flow. Click an unplaced system in the panel, then click an empty hex to place it.',
      },
    },
  },
}
