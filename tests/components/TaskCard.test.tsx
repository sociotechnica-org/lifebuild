import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TaskCard } from '../../src/components/TaskCard.js'

// Hoisted mocks
const { mockUseDraggable } = vi.hoisted(() => {
  const mockUseDraggable = vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }))
  return { mockUseDraggable }
})

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDraggable: mockUseDraggable,
}))

describe('TaskCard', () => {
  const mockTask = {
    id: 'test-task',
    boardId: 'test-board',
    columnId: 'test-column',
    title: 'Test Task',
    position: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }

  it('should render task title', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    render(<TaskCard task={mockTask} />)
    const card = screen.getByText('Test Task').closest('div')
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm')
  })

  it('should render with drag overlay styling', () => {
    render(<TaskCard task={mockTask} isDragOverlay />)
    const card = screen.getByText('Test Task').closest('div')
    expect(card).toHaveClass('shadow-lg', 'rotate-2')
  })

  it('should render with dragging state styling', () => {
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: true,
    })

    render(<TaskCard task={mockTask} />)
    const card = screen.getByText('Test Task').closest('div')
    expect(card).toHaveClass('opacity-50')
  })
})
