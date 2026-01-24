import React from 'react'
import { render, screen, within, createMockProject } from '../../../../tests/test-utils.js'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { TableBronzeProjectEntry } from '@lifebuild/shared/schema'
import { TableBar } from './TableBar.js'

let mockProjects = [] as ReturnType<typeof createMockProject>[]
let mockTableState: { configuration: null; tabledBronzeProjects: TableBronzeProjectEntry[] } = {
  configuration: null,
  tabledBronzeProjects: [],
}

vi.mock('../../../livestore-compat.js', () => ({
  useQuery: () => mockProjects,
}))

vi.mock('../../../hooks/useTableState.js', () => ({
  useTableState: () => mockTableState,
}))

describe('TableBar', () => {
  beforeEach(() => {
    mockProjects = []
    mockTableState = { configuration: null, tabledBronzeProjects: [] }
  })

  it('shows the top tabled bronze project and count', () => {
    const firstProject = createMockProject({
      id: 'bronze-1',
      name: 'Bronze Project One',
      category: 'growth',
    })
    const secondProject = createMockProject({
      id: 'bronze-2',
      name: 'Bronze Project Two',
      category: 'home',
    })

    mockProjects = [firstProject, secondProject]
    mockTableState = {
      configuration: null,
      tabledBronzeProjects: [
        {
          id: 'entry-1',
          projectId: firstProject.id,
          position: 0,
          tabledAt: new Date(),
          tabledBy: null,
          status: 'active',
          removedAt: null,
        },
        {
          id: 'entry-2',
          projectId: secondProject.id,
          position: 1,
          tabledAt: new Date(),
          tabledBy: null,
          status: 'active',
          removedAt: null,
        },
      ],
    }

    render(
      <MemoryRouter>
        <TableBar />
      </MemoryRouter>
    )

    const bronzeSlot = screen.getByText('To-Do').closest('div')
    expect(bronzeSlot).not.toBeNull()

    const bronzeScope = within(bronzeSlot as HTMLElement)
    expect(bronzeScope.getByText('Bronze Project One')).toBeInTheDocument()
    expect(bronzeScope.getByText('+1 more')).toBeInTheDocument()
  })

  it('skips orphaned bronze entries when selecting the top project', () => {
    const validProject = createMockProject({
      id: 'bronze-valid',
      name: 'Valid Bronze Project',
    })

    mockProjects = [validProject]
    mockTableState = {
      configuration: null,
      tabledBronzeProjects: [
        {
          id: 'entry-orphan',
          projectId: 'missing-project',
          position: 0,
          tabledAt: new Date(),
          tabledBy: null,
          status: 'active',
          removedAt: null,
        },
        {
          id: 'entry-valid',
          projectId: validProject.id,
          position: 1,
          tabledAt: new Date(),
          tabledBy: null,
          status: 'active',
          removedAt: null,
        },
      ],
    }

    render(
      <MemoryRouter>
        <TableBar />
      </MemoryRouter>
    )

    const bronzeSlot = screen.getByText('To-Do').closest('div')
    expect(bronzeSlot).not.toBeNull()

    const bronzeScope = within(bronzeSlot as HTMLElement)
    expect(bronzeScope.getByText('Valid Bronze Project')).toBeInTheDocument()
    expect(bronzeScope.queryByText('Empty')).not.toBeInTheDocument()
  })
})
