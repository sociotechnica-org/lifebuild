import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { KanbanColumn } from '../../src/components/KanbanColumn.js'

describe('KanbanColumn', () => {
  const mockColumn = {
    id: 'test-column',
    boardId: 'test-board',
    name: 'Test Column',
    position: 0,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
  }

  const mockTasks = [
    {
      id: 'task-1',
      boardId: 'test-board',
      columnId: 'test-column',
      title: 'Task 1',
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'task-2',
      boardId: 'test-board',
      columnId: 'test-column',
      title: 'Task 2',
      createdAt: new Date('2023-01-02'),
    },
  ]

  it('should render column name', () => {
    render(<KanbanColumn column={mockColumn} tasks={[]} />)
    expect(screen.getByText('Test Column')).toBeInTheDocument()
  })

  it('should render task count', () => {
    render(<KanbanColumn column={mockColumn} tasks={mockTasks} />)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should render tasks', () => {
    render(<KanbanColumn column={mockColumn} tasks={mockTasks} />)
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()
  })

  it('should show empty state when no tasks', () => {
    render(<KanbanColumn column={mockColumn} tasks={[]} />)
    expect(screen.getByText('No tasks yet')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
