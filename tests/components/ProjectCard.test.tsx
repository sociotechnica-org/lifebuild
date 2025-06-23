import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProjectCard } from '../../src/components/ProjectCard.js'

describe('ProjectCard', () => {
  const mockProject = {
    id: 'test-project',
    name: 'Test Project',
    description: 'Test project description',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    deletedAt: null,
  }

  it('should render project name', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
  })

  it('should render creation and update information', () => {
    render(<ProjectCard project={mockProject} />)
    expect(screen.getByText(/Created:/)).toBeInTheDocument()
    expect(screen.getByText(/Updated:/)).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<ProjectCard project={mockProject} onClick={onClick} />)

    const card = screen.getByText('Test Project').closest('div')
    card?.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should render without onClick handler', () => {
    expect(() => render(<ProjectCard project={mockProject} />)).not.toThrow()
  })
})
