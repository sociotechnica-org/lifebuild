import React from 'react'
import { render, screen, waitFor } from '../../../../tests/test-utils.js'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ProjectCard } from './ProjectCard.js'
import { createMockProject } from '../../../../tests/test-utils.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = {
    query: vi.fn().mockResolvedValue([]),
    commit: vi.fn(),
  }
  return { mockStore }
})

// Mock livestore-compat
vi.mock('../../../livestore-compat.js', () => ({
  useStore: () => ({ store: mockStore }),
  useQuery: vi.fn(() => []),
}))

describe('ProjectCard', () => {
  const mockProject = createMockProject({
    name: 'Test Project',
    description: 'Test project description',
    updatedAt: new Date('2023-01-02'),
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render project name', async () => {
    render(<ProjectCard project={mockProject} />)

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })

  it('should render creation and update information', async () => {
    render(<ProjectCard project={mockProject} />)

    await waitFor(() => {
      expect(screen.getByText(/Created/i)).toBeInTheDocument()
      expect(screen.getByText(/Updated/i)).toBeInTheDocument()
    })
  })

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<ProjectCard project={mockProject} onClick={onClick} />)

    await waitFor(() => {
      const card = screen.getByText('Test Project').closest('div')
      card?.click()
    })

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should render without onClick handler', async () => {
    expect(() => {
      render(<ProjectCard project={mockProject} />)
    }).not.toThrow()

    // Wait for async operations to complete
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })
})
