import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HistoryPanel } from '../../src/components/history/HistoryPanel.js'

// Hoisted mocks
const { mockGetAllEvents, mockGetUsers, mockGetWorkers } = vi.hoisted(() => {
  const mockGetAllEvents = vi.fn().mockReturnValue([])
  const mockGetUsers = vi.fn().mockReturnValue([])
  const mockGetWorkers = vi.fn().mockReturnValue([])

  return { mockGetAllEvents, mockGetUsers, mockGetWorkers }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useQuery: vi.fn().mockImplementation(query => {
    if (query.name === 'getAllEvents') return mockGetAllEvents()
    if (query.name === 'getUsers') return mockGetUsers()
    if (query.name === 'getWorkers') return mockGetWorkers()
    return []
  }),
}))

// Mock the queries
vi.mock('@work-squared/shared/queries', () => ({
  getAllEvents$: { name: 'getAllEvents' },
  getUsers$: { name: 'getUsers' },
  getWorkers$: { name: 'getWorkers' },
}))

// Mock React Router
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}))

// Mock navigation utilities
vi.mock('../../src/utils/navigation.js', () => ({
  preserveStoreIdInUrl: vi.fn(url => url),
  generateRoute: {
    project: vi.fn(id => `/project/${id}`),
  },
}))

describe('HistoryPanel Worker Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display worker name for worker-created project events', async () => {
    const workerId = 'worker-ai-123'
    const workerName = 'AI Project Manager'
    const projectId = 'project-123'
    const projectName = 'AI Generated Project'

    // Mock the eventsLog data
    mockGetAllEvents.mockReturnValue([
      {
        id: `project_created_${projectId}`,
        eventType: 'v1.ProjectCreated',
        eventData: JSON.stringify({
          id: projectId,
          name: projectName,
          description: 'A project created by AI assistant',
        }),
        actorId: workerId,
        createdAt: new Date(),
      },
    ])

    // Mock the workers data
    mockGetWorkers.mockReturnValue([
      {
        id: workerId,
        name: workerName,
      },
    ])

    // Mock the users data (empty)
    mockGetUsers.mockReturnValue([])

    // Render the HistoryPanel
    render(<HistoryPanel />)

    // Check that the project creation event is displayed
    expect(screen.getByText(`Created project "${projectName}"`)).toBeInTheDocument()

    // Check that the worker name is displayed as the actor
    expect(screen.getByText(`by ${workerName} (Worker)`)).toBeInTheDocument()

    // Check that the project description is displayed (truncated)
    expect(screen.getByText('A project created by AI assistant')).toBeInTheDocument()
  })

  it('should display user name for user-created project events', async () => {
    const userId = 'user-123'
    const userName = 'John Doe'
    const projectId = 'project-456'
    const projectName = 'User Created Project'

    // Mock the eventsLog data
    mockGetAllEvents.mockReturnValue([
      {
        id: `project_created_${projectId}`,
        eventType: 'v1.ProjectCreated',
        eventData: JSON.stringify({
          id: projectId,
          name: projectName,
          description: 'A project created by a human user',
        }),
        actorId: userId,
        createdAt: new Date(),
      },
    ])

    // Mock the users data
    mockGetUsers.mockReturnValue([
      {
        id: userId,
        name: userName,
      },
    ])

    // Mock the workers data (empty)
    mockGetWorkers.mockReturnValue([])

    // Render the HistoryPanel
    render(<HistoryPanel />)

    // Check that the project creation event is displayed
    expect(screen.getByText(`Created project "${projectName}"`)).toBeInTheDocument()

    // Check that the user name is displayed as the actor (without "(Worker)" suffix)
    expect(screen.getByText(`by ${userName}`)).toBeInTheDocument()
    expect(screen.queryByText(`by ${userName} (Worker)`)).not.toBeInTheDocument()
  })

  it('should handle project creation without actor (legacy events)', async () => {
    const projectId = 'project-789'
    const projectName = 'Legacy Project'

    // Mock the eventsLog data without actorId
    mockGetAllEvents.mockReturnValue([
      {
        id: `project_created_${projectId}`,
        eventType: 'v1.ProjectCreated',
        eventData: JSON.stringify({
          id: projectId,
          name: projectName,
          description: 'A project created before actor tracking',
        }),
        actorId: null, // No actor
        createdAt: new Date(),
      },
    ])

    // Mock empty users and workers data
    mockGetUsers.mockReturnValue([])
    mockGetWorkers.mockReturnValue([])

    // Render the HistoryPanel
    render(<HistoryPanel />)

    // Check that the project creation event is displayed
    expect(screen.getByText(`Created project "${projectName}"`)).toBeInTheDocument()

    // Check that no actor is displayed
    expect(screen.queryByText(/^by /)).not.toBeInTheDocument()
  })

  it('should handle unknown actor gracefully', async () => {
    const unknownActorId = 'unknown-actor-123'
    const projectId = 'project-999'
    const projectName = 'Unknown Actor Project'

    // Mock the eventsLog data with unknown actor
    mockGetAllEvents.mockReturnValue([
      {
        id: `project_created_${projectId}`,
        eventType: 'v1.ProjectCreated',
        eventData: JSON.stringify({
          id: projectId,
          name: projectName,
          description: 'A project with unknown actor',
        }),
        actorId: unknownActorId, // This actor doesn't exist in our mocked data
        createdAt: new Date(),
      },
    ])

    // Mock empty users and workers data
    mockGetUsers.mockReturnValue([])
    mockGetWorkers.mockReturnValue([])

    // Render the HistoryPanel
    render(<HistoryPanel />)

    // Check that the project creation event is displayed
    expect(screen.getByText(`Created project "${projectName}"`)).toBeInTheDocument()

    // Check that "Unknown user" is displayed for the actor
    expect(screen.getByText('by Unknown user')).toBeInTheDocument()
  })

  it('should display multiple events with different actors correctly', async () => {
    const workerId = 'worker-design'
    const userId = 'user-manager'
    const workerName = 'Design AI'
    const userName = 'Project Manager'

    // Mock multiple events
    mockGetAllEvents.mockReturnValue([
      {
        id: 'project_created_project-worker',
        eventType: 'v1.ProjectCreated',
        eventData: JSON.stringify({
          id: 'project-worker',
          name: 'AI Design Project',
          description: 'Created by AI',
        }),
        actorId: workerId,
        createdAt: new Date('2023-01-01T10:00:00Z'),
      },
      {
        id: 'project_created_project-user',
        eventType: 'v1.ProjectCreated',
        eventData: JSON.stringify({
          id: 'project-user',
          name: 'Management Project',
          description: 'Created by manager',
        }),
        actorId: userId,
        createdAt: new Date('2023-01-01T11:00:00Z'),
      },
    ])

    // Mock both workers and users data
    mockGetWorkers.mockReturnValue([
      {
        id: workerId,
        name: workerName,
      },
    ])

    mockGetUsers.mockReturnValue([
      {
        id: userId,
        name: userName,
      },
    ])

    // Render the HistoryPanel
    render(<HistoryPanel />)

    // Check that both project creation events are displayed
    expect(screen.getByText('Created project "AI Design Project"')).toBeInTheDocument()
    expect(screen.getByText('Created project "Management Project"')).toBeInTheDocument()

    // Check that the correct actors are displayed
    expect(screen.getByText(`by ${workerName} (Worker)`)).toBeInTheDocument()
    expect(screen.getByText(`by ${userName}`)).toBeInTheDocument()

    // Ensure the user doesn't have "(Worker)" suffix
    expect(screen.queryByText(`by ${userName} (Worker)`)).not.toBeInTheDocument()
  })
})
