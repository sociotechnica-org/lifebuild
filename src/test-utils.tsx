import '@testing-library/jest-dom'
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import type { Task, Column, Project } from './livestore/schema.js'

// Simple test wrapper for basic component testing
interface TestProviderProps {
  children: React.ReactNode
}

function TestProvider({ children }: TestProviderProps) {
  // Simple wrapper for now - can be enhanced later for LiveStore
  return <div data-testid='test-wrapper'>{children}</div>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, {
    wrapper: ({ children }) => <TestProvider>{children}</TestProvider>,
    ...options,
  })
}

// Mock createTestStore for tests that expect it
const createTestStore = () => {
  const mockData = new Map()

  return {
    mutate: () => Promise.resolve(undefined),
    commit: (event: any) => {
      // Simple mock implementation for commit
      if (event.name === 'v1.DocumentCreated') {
        const docs = mockData.get('documents') || []
        docs.push({
          id: event.args.id,
          title: event.args.title,
          content: event.args.content,
          createdAt: event.args.createdAt,
          updatedAt: event.args.createdAt,
          archivedAt: null,
        })
        mockData.set('documents', docs)
      }
      if (event.name === 'v1.WorkerCreated') {
        const workers = mockData.get('workers') || []
        workers.push({
          id: event.args.id,
          name: event.args.name,
          roleDescription: event.args.roleDescription || null,
          systemPrompt: event.args.systemPrompt,
          avatar: event.args.avatar || null,
          createdAt: event.args.createdAt,
          updatedAt: event.args.createdAt,
          isActive: true,
        })
        mockData.set('workers', workers)
      }
      if (event.name === 'v1.ProjectCreated') {
        const projects = mockData.get('projects') || []
        projects.push({
          id: event.args.id,
          name: event.args.name,
          description: event.args.description || null,
          createdAt: event.args.createdAt,
          updatedAt: event.args.createdAt,
          deletedAt: null,
        })
        mockData.set('projects', projects)
      }
      if (event.name === 'v1.WorkerAssignedToProject') {
        const assignments = mockData.get('workerProjects') || []
        const compositeId = `${event.args.workerId}-${event.args.projectId}`
        // Check if assignment already exists to prevent duplicates
        const existingAssignment = assignments.find((wp: any) => wp.id === compositeId)
        if (!existingAssignment) {
          assignments.push({
            id: compositeId,
            workerId: event.args.workerId,
            projectId: event.args.projectId,
          })
        }
        mockData.set('workerProjects', assignments)
      }
      if (event.name === 'v1.WorkerUnassignedFromProject') {
        const assignments = mockData.get('workerProjects') || []
        const compositeId = `${event.args.workerId}-${event.args.projectId}`
        const filtered = assignments.filter((wp: any) => wp.id !== compositeId)
        mockData.set('workerProjects', filtered)
      }
    },
    query: (queryObj: any) => {
      // Handle different query types based on the query object
      if (queryObj && queryObj.label && queryObj.label.includes('Document')) {
        return mockData.get('documents') || []
      }
      if (queryObj && queryObj.label === 'getDocumentList') {
        return mockData.get('documents') || []
      }
      if (queryObj && queryObj.label === 'getWorkers') {
        return mockData.get('workers') || []
      }
      if (queryObj && queryObj.label === 'getProjects') {
        return mockData.get('projects') || []
      }
      if (queryObj && queryObj.label === 'getAllWorkerProjects') {
        return mockData.get('workerProjects') || []
      }
      if (queryObj && queryObj.label && queryObj.label.startsWith('getWorkerProjects:')) {
        const workerId = queryObj.label.split(':')[1]
        const assignments = mockData.get('workerProjects') || []
        return assignments.filter((wp: any) => wp.workerId === workerId)
      }
      if (queryObj && queryObj.label && queryObj.label.startsWith('getProjectWorkers:')) {
        const projectId = queryObj.label.split(':')[1]
        const assignments = mockData.get('workerProjects') || []
        return assignments.filter((wp: any) => wp.projectId === projectId)
      }
      // Fallback for any query that might contain 'document'
      if (queryObj && JSON.stringify(queryObj).toLowerCase().includes('document')) {
        return mockData.get('documents') || []
      }
      return []
    },
    subscribe: () => () => {},
  }
}

// Factory functions for creating test data
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-task',
  projectId: 'test-project',
  columnId: 'test-column',
  title: 'Test Task',
  description: null,
  assigneeIds: '[]',
  position: 0,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  archivedAt: null,
  ...overrides,
})

export const createMockColumn = (overrides: Partial<Column> = {}): Column => ({
  id: 'test-column',
  projectId: 'test-project',
  name: 'Test Column',
  position: 0,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
})

export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'test-project',
  name: 'Test Project',
  description: null,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  deletedAt: null,
  ...overrides,
})

// Helper to create multiple tasks with sequential IDs and positions
export const createMockTasks = (count: number, baseOverrides: Partial<Task> = {}): Task[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockTask({
      id: `task-${index + 1}`,
      title: `Task ${index + 1}`,
      position: index,
      ...baseOverrides,
    })
  )
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, createTestStore }
