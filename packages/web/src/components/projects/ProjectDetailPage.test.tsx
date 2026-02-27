import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { ProjectDetailPage } from './ProjectDetailPage.js'

const mockCommit = vi.fn()
const mockUseQuery = vi.fn()
const mockCapture = vi.fn()

vi.mock('../../livestore-compat.js', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useStore: () => ({
    store: {
      commit: mockCommit,
    },
  }),
}))

vi.mock('../../hooks/useProjectChatLifecycle.js', () => ({
  useProjectChatLifecycle: vi.fn(),
}))

vi.mock('../../contexts/AuthContext.js', () => ({
  useAuth: () => ({
    user: { id: 'test-user' },
  }),
}))

vi.mock('../../lib/analytics.js', () => ({
  usePostHog: () => ({
    capture: mockCapture,
  }),
}))

const mockProject = {
  id: 'project-1',
  name: 'Project Overlay Test',
  description: 'Validate overlay details and task flows.',
  category: null,
  attributes: null,
  projectLifecycleState: { status: 'active', stage: 4 },
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  deletedAt: null,
  archivedAt: null,
}

const mockTasks = [
  {
    id: 'task-1',
    projectId: 'project-1',
    title: 'Draft requirements',
    description: 'Write initial acceptance criteria.',
    status: 'todo',
    assigneeIds: [],
    attributes: null,
    position: 1000,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    archivedAt: null,
  },
]

const renderProjectDetailPage = () => {
  return render(
    <MemoryRouter initialEntries={['/projects/project-1']}>
      <Routes>
        <Route path='/projects/:projectId' element={<ProjectDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

const expectCommittedEvent = (event: unknown, expectedName: string, expectedPayload?: string) => {
  const serializedEvent = JSON.stringify(event)
  expect(serializedEvent).toContain(expectedName)
  if (expectedPayload) {
    expect(serializedEvent).toContain(expectedPayload)
  }
}

describe('ProjectDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    let queryCount = 0
    mockUseQuery.mockImplementation(() => {
      queryCount += 1
      const querySlot = ((queryCount - 1) % 3) + 1

      if (querySlot === 1) {
        return [mockProject]
      }

      return mockTasks
    })

    vi.stubGlobal('crypto', {
      randomUUID: () => 'task-new',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders project name, description, and task list content in the overlay surface', () => {
    renderProjectDetailPage()

    expect(screen.getByRole('heading', { name: 'Project Overlay Test' })).toBeInTheDocument()
    expect(screen.getByTestId('project-header-description')).toHaveTextContent(
      'Validate overlay details and task flows.'
    )
    expect(screen.getByText('Task list')).toBeInTheDocument()
    expect(screen.getByText('Draft requirements')).toBeInTheDocument()
  })

  it('supports task add, toggle, and edit interactions', () => {
    renderProjectDetailPage()

    const addTaskInput = screen.getByPlaceholderText('Task name')
    fireEvent.change(addTaskInput, { target: { value: 'Write overlay tests' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add task' }))

    expect(mockCommit).toHaveBeenCalledTimes(1)
    expectCommittedEvent(mockCommit.mock.calls[0]?.[0], 'v2.TaskCreated', 'Write overlay tests')

    mockCommit.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Cycle status for Draft requirements' }))
    expect(mockCommit).toHaveBeenCalledTimes(1)
    expectCommittedEvent(mockCommit.mock.calls[0]?.[0], 'v2.TaskStatusChanged')

    mockCommit.mockClear()

    fireEvent.click(screen.getByText('Draft requirements'))
    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }))

    const titleInput = screen.getByPlaceholderText('Task title')
    fireEvent.change(titleInput, { target: { value: 'Refine overlay tests' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(mockCommit).toHaveBeenCalledTimes(1)
    expectCommittedEvent(mockCommit.mock.calls[0]?.[0], 'v1.TaskUpdated', 'Refine overlay tests')
  })
})
