import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { getAllTasks$, getHexPositions$, getProjects$ } from '@lifebuild/shared/queries'
import type { HexPosition, Project, Task } from '@lifebuild/shared/schema'
import { TaskQueuePanel, TASK_QUEUE_COLLAPSED_STORAGE_KEY } from './TaskQueuePanel.js'

const mockUseQuery = vi.fn()
const mockCommit = vi.fn()
const mockNavigate = vi.fn()

vi.mock('../../livestore-compat.js', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useStore: () => ({
    store: {
      commit: mockCommit,
    },
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

let projectsData: Project[] = []
let tasksData: Task[] = []
let hexPositionsData: HexPosition[] = []

const createProject = (id: string, name: string): Project => ({
  id,
  name,
  description: null,
  category: null,
  attributes: null,
  projectLifecycleState: null,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  deletedAt: null,
  archivedAt: null,
})

const createTask = (
  id: string,
  projectId: string,
  title: string,
  overrides: Partial<Task> = {}
): Task => ({
  id,
  projectId,
  title,
  description: null,
  status: 'todo',
  assigneeIds: '[]',
  attributes: null,
  position: 1000,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  archivedAt: null,
  ...overrides,
})

const createHexPosition = (
  id: string,
  projectId: string,
  hexQ: number,
  hexR: number
): HexPosition => ({
  id,
  hexQ,
  hexR,
  entityType: 'project',
  entityId: projectId,
  placedAt: new Date('2024-01-01T00:00:00Z'),
})

describe('TaskQueuePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()

    projectsData = []
    tasksData = []
    hexPositionsData = []

    mockUseQuery.mockImplementation(query => {
      if (query === getProjects$) {
        return projectsData
      }

      if (query === getAllTasks$) {
        return tasksData
      }

      if (query === getHexPositions$) {
        return hexPositionsData
      }

      return []
    })
  })

  it('does not render when fewer than two projects are placed on the map', () => {
    projectsData = [
      createProject('project-a', 'Alpha Project'),
      createProject('project-b', 'Beta Project'),
    ]
    hexPositionsData = [createHexPosition('hex-1', 'project-a', 0, 0)]

    render(<TaskQueuePanel />)

    expect(screen.queryByTestId('task-queue-panel')).not.toBeInTheDocument()
  })

  it('renders tasks grouped by project name when two or more projects are placed', () => {
    projectsData = [
      createProject('project-b', 'Beta Project'),
      createProject('project-a', 'Alpha Project'),
    ]
    hexPositionsData = [
      createHexPosition('hex-1', 'project-a', 0, 0),
      createHexPosition('hex-2', 'project-b', 1, 0),
    ]
    tasksData = [
      createTask('task-b-1', 'project-b', 'Beta Task'),
      createTask('task-a-1', 'project-a', 'Alpha Task'),
    ]

    render(<TaskQueuePanel />)

    expect(screen.getByTestId('task-queue-panel')).toBeInTheDocument()

    const projectHeadings = Array.from(
      screen.getByTestId('task-queue-content').querySelectorAll('section > h3')
    ).map(node => node.textContent)
    expect(projectHeadings).toEqual(['Alpha Project', 'Beta Project'])

    expect(screen.getByText('Alpha Task')).toBeInTheDocument()
    expect(screen.getByText('Beta Task')).toBeInTheDocument()
  })

  it('navigates to the project overlay route when a task is clicked', () => {
    window.history.replaceState({}, '', '/?storeId=test-store')

    projectsData = [
      createProject('project-a', 'Alpha Project'),
      createProject('project-b', 'Beta Project'),
    ]
    hexPositionsData = [
      createHexPosition('hex-1', 'project-a', 0, 0),
      createHexPosition('hex-2', 'project-b', 1, 0),
    ]
    tasksData = [createTask('task-a-1', 'project-a', 'Queue Navigation Task')]

    render(<TaskQueuePanel />)

    fireEvent.click(screen.getByText('Queue Navigation Task'))

    expect(mockNavigate).toHaveBeenCalledWith('/projects/project-a?storeId=test-store', {
      state: { openedFromMap: true },
    })
  })

  it('cycles task status through the shared event path without triggering navigation', () => {
    projectsData = [
      createProject('project-a', 'Alpha Project'),
      createProject('project-b', 'Beta Project'),
    ]
    hexPositionsData = [
      createHexPosition('hex-1', 'project-a', 0, 0),
      createHexPosition('hex-2', 'project-b', 1, 0),
    ]
    tasksData = [
      createTask('task-a-target', 'project-a', 'Target Task', {
        status: 'todo',
        position: 1000,
      }),
      createTask('task-a-doing', 'project-a', 'Existing Doing Task', {
        status: 'doing',
        position: 2500,
      }),
      createTask('task-b-doing', 'project-b', 'Other Project Doing Task', {
        status: 'doing',
        position: 9000,
      }),
    ]

    render(<TaskQueuePanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Cycle status for Target Task' }))

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(mockCommit).toHaveBeenCalledTimes(1)

    const serializedEvent = JSON.stringify(mockCommit.mock.calls[0]?.[0])
    expect(serializedEvent).toContain('v2.TaskStatusChanged')
    expect(serializedEvent).toContain('task-a-target')
    expect(serializedEvent).toContain('doing')
    expect(serializedEvent).toContain('3500')
  })

  it('persists collapsed state in localStorage across remounts', () => {
    projectsData = [
      createProject('project-a', 'Alpha Project'),
      createProject('project-b', 'Beta Project'),
    ]
    hexPositionsData = [
      createHexPosition('hex-1', 'project-a', 0, 0),
      createHexPosition('hex-2', 'project-b', 1, 0),
    ]

    const firstRender = render(<TaskQueuePanel />)

    fireEvent.click(screen.getByTestId('task-queue-toggle'))

    expect(screen.queryByTestId('task-queue-content')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(TASK_QUEUE_COLLAPSED_STORAGE_KEY)).toBe('true')

    firstRender.unmount()

    render(<TaskQueuePanel />)

    expect(screen.queryByTestId('task-queue-content')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expand task queue' })).toBeInTheDocument()
  })
})
