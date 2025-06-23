import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ProjectProvider, useProject } from '../../src/contexts/ProjectContext.js'
import { createMockProject } from '../../src/test-utils.js'

// Hoisted mocks
const { mockUseQuery } = vi.hoisted(() => {
  const mockUseQuery = vi.fn()
  return { mockUseQuery }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useQuery: mockUseQuery,
}))

// Test component that uses the context
const TestComponent = () => {
  const { project, projectId, isLoading } = useProject()
  return (
    <div>
      <div data-testid='project-id'>{projectId || 'null'}</div>
      <div data-testid='project-name'>{project?.name || 'no project'}</div>
      <div data-testid='is-loading'>{isLoading ? 'loading' : 'not loading'}</div>
    </div>
  )
}

describe('ProjectContext', () => {
  const mockProject = createMockProject({ id: 'test-project', name: 'Test Project' })

  beforeEach(() => {
    mockUseQuery.mockReturnValue([mockProject])
  })

  it('should provide project data when projectId is provided', () => {
    render(
      <ProjectProvider projectId='test-project'>
        <TestComponent />
      </ProjectProvider>
    )

    expect(screen.getByTestId('project-id')).toHaveTextContent('test-project')
    expect(screen.getByTestId('project-name')).toHaveTextContent('Test Project')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('not loading')
  })

  it('should handle null projectId', () => {
    render(
      <ProjectProvider projectId={null}>
        <TestComponent />
      </ProjectProvider>
    )

    expect(screen.getByTestId('project-id')).toHaveTextContent('null')
    expect(screen.getByTestId('project-name')).toHaveTextContent('no project')
    expect(screen.getByTestId('is-loading')).toHaveTextContent('not loading')
  })

  it('should show loading state when no project data is available', () => {
    mockUseQuery.mockReturnValue(null)

    render(
      <ProjectProvider projectId='test-project'>
        <TestComponent />
      </ProjectProvider>
    )

    expect(screen.getByTestId('is-loading')).toHaveTextContent('loading')
  })

  it('should throw error when useProject is used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error
    console.error = vi.fn()

    expect(() => render(<TestComponent />)).toThrow(
      'useProject must be used within a ProjectProvider'
    )

    console.error = originalError
  })
})