import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TaskCard } from '../../src/components/TaskCard.js'
import { createMockTask } from '../../src/test-utils.js'

// Hoisted mocks
const { mockUseDraggable, mockUseDroppable } = vi.hoisted(() => {
  const mockUseDraggable = vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }))
  const mockUseDroppable = vi.fn(() => ({
    setNodeRef: vi.fn(),
    isOver: false,
  }))
  return { mockUseDraggable, mockUseDroppable }
})

// Mock @dnd-kit/core
vi.mock('@dnd-kit/core', () => ({
  useDraggable: mockUseDraggable,
  useDroppable: mockUseDroppable,
}))

describe('TaskCard', () => {
  const mockTask = createMockTask()

  beforeEach(() => {
    // Reset mocks before each test
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false,
    })
    mockUseDroppable.mockReturnValue({
      setNodeRef: vi.fn(),
      isOver: false,
    })
  })

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

  it('should call onClick when clicked and not dragging', () => {
    const mockOnClick = vi.fn()
    render(<TaskCard task={mockTask} onClick={mockOnClick} />)

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledWith('test-task')
  })

  it('should not call onClick when dragging', () => {
    const mockOnClick = vi.fn()
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: true,
    })

    render(<TaskCard task={mockTask} onClick={mockOnClick} />)

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.click(card)

    expect(mockOnClick).not.toHaveBeenCalled()
  })

  it('should not call onClick when no handler provided', () => {
    render(<TaskCard task={mockTask} />)

    const card = screen.getByText('Test Task').closest('div')!

    // Should not throw error when clicked without onClick handler
    expect(() => fireEvent.click(card)).not.toThrow()
  })

  it('should stop propagation when clicked', () => {
    const mockOnClick = vi.fn()
    const mockParentClick = vi.fn()

    render(
      <div onClick={mockParentClick}>
        <TaskCard task={mockTask} onClick={mockOnClick} />
      </div>
    )

    const card = screen.getByText('Test Task').closest('div')!
    fireEvent.click(card)

    expect(mockOnClick).toHaveBeenCalledWith('test-task')
    expect(mockParentClick).not.toHaveBeenCalled()
  })
})
