import type { Meta, StoryObj } from '@storybook/react'
import { createHex } from '@lifebuild/shared/hex'
import type { HexCoord } from '@lifebuild/shared/hex'
import React from 'react'
import { useState } from 'react'
import { HexMap } from './HexMap.js'
import type { PlacedHexTile } from './HexGrid.js'
import type { PanelProjectItem } from './UnplacedPanel.js'

const meta: Meta<typeof HexMap> = {
  title: 'Life Map/HexMap',
  component: HexMap,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Map-first Three.js surface with fixed landmarks (campfire, sanctuary, workshop), project tiles, and overlay panels.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HexMap>

export default meta
type Story = StoryObj<typeof meta>

export const EmptyGrid: Story = {
  render: () => (
    <div className='h-dvh w-full'>
      <HexMap />
    </div>
  ),
}

export const WithProjectTiles: Story = {
  render: () => (
    <div className='h-dvh w-full'>
      <HexMap
        tiles={[
          {
            id: 'tile-1',
            projectId: 'project-1',
            coord: createHex(-1, 1),
            projectName: 'Launch beta map',
            categoryColor: '#10B981',
            category: 'growth',
          },
          {
            id: 'tile-2',
            projectId: 'project-2',
            coord: createHex(2, -1),
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
      <div className='h-dvh w-full'>
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
