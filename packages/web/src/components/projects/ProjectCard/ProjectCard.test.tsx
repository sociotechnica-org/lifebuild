import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ProjectCard } from './ProjectCard.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = {
    query: vi.fn().mockResolvedValue([]),
    commit: vi.fn(),
  }
  return { mockStore }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
}))

describe('ProjectCard', () => {
  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    description: 'Test project description',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    deletedAt: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render project name', async () => {
    await act(async () => {
      render(<ProjectCard project={mockProject} />)
    })
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should render creation and update information', async () => {
    await act(async () => {
      render(<ProjectCard project={mockProject} />)
    })
    expect(screen.getByText(/Created:/)).toBeInTheDocument()
    expect(screen.getByText(/Updated:/)).toBeInTheDocument()
  })

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn()
    await act(async () => {
      render(<ProjectCard project={mockProject} onClick={onClick} />)
    })

    const card = screen.getByText('Test Project').closest('div')
    card?.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should render without onClick handler', async () => {
    await act(async () => {
      expect(() => render(<ProjectCard project={mockProject} />)).not.toThrow()
    })
  })
})
