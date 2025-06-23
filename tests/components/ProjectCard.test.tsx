import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BoardCard } from '../../src/components/BoardCard.js'

describe('BoardCard', () => {
  const mockBoard = {
    id: 'test-board',
    name: 'Test Board',
    description: 'Test project description',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-02'),
    deletedAt: null,
  }

  it('should render board name', () => {
    render(<BoardCard board={mockBoard} />)
    expect(screen.getByText('Test Board')).toBeInTheDocument()
  })

  it('should render creation and update information', () => {
    render(<BoardCard board={mockBoard} />)
    expect(screen.getByText(/Created:/)).toBeInTheDocument()
    expect(screen.getByText(/Updated:/)).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = vi.fn()
    render(<BoardCard board={mockBoard} onClick={onClick} />)

    const card = screen.getByText('Test Board').closest('div')
    card?.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should render without onClick handler', () => {
    expect(() => render(<BoardCard board={mockBoard} />)).not.toThrow()
  })
})
