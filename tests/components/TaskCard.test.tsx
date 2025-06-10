import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TaskCard } from '../../src/components/TaskCard.js'

describe('TaskCard', () => {
  const mockTask = {
    id: 'test-task',
    boardId: 'test-board',
    columnId: 'test-column',
    title: 'Test Task',
    createdAt: new Date('2023-01-01'),
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
})
