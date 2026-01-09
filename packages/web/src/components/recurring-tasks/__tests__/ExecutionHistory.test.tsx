import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from "../../../../tests/test-utils.js"
import { ExecutionHistory } from '../ExecutionHistory'
import type { TaskExecution } from '@lifebuild/shared/schema'

// Mock the useQuery hook
vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(),
}))

import { useQuery } from '../../../livestore-compat.js'

describe('ExecutionHistory', () => {
  it('should display empty state when no executions', () => {
    vi.mocked(useQuery).mockReturnValue([])

    render(<ExecutionHistory recurringTaskId='task-1' />)

    expect(screen.getByText('No execution history yet')).toBeInTheDocument()
  })

  it('should display recent executions', () => {
    const mockExecutions: TaskExecution[] = [
      {
        id: 'exec-1',
        recurringTaskId: 'task-1',
        startedAt: new Date('2024-01-01T12:00:00Z'),
        completedAt: new Date('2024-01-01T12:00:30Z'),
        status: 'completed',
        output: 'Success',
        createdTaskIds: '["task-a"]',
      },
      {
        id: 'exec-2',
        recurringTaskId: 'task-1',
        startedAt: new Date('2024-01-01T11:00:00Z'),
        completedAt: new Date('2024-01-01T11:00:45Z'),
        status: 'failed',
        output: 'Error occurred',
        createdTaskIds: '[]',
      },
      {
        id: 'exec-3',
        recurringTaskId: 'task-1',
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: null,
        status: 'running',
        output: null,
        createdTaskIds: '[]',
      },
    ]

    vi.mocked(useQuery).mockReturnValue(mockExecutions)

    render(<ExecutionHistory recurringTaskId='task-1' />)

    expect(screen.getByText('Recent Executions')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('failed')).toBeInTheDocument()
    expect(screen.getByText('running')).toBeInTheDocument()
    expect(screen.getByText('1 task created')).toBeInTheDocument()
  })

  it('should limit displayed executions to maxItems', () => {
    const mockExecutions: TaskExecution[] = Array.from({ length: 10 }, (_, i) => ({
      id: `exec-${i}`,
      recurringTaskId: 'task-1',
      startedAt: new Date(`2024-01-01T${12 - i}:00:00Z`),
      completedAt: new Date(`2024-01-01T${12 - i}:00:30Z`),
      status: 'completed' as const,
      output: 'Success',
      createdTaskIds: '[]',
    }))

    vi.mocked(useQuery).mockReturnValue(mockExecutions)

    const { container } = render(<ExecutionHistory recurringTaskId='task-1' maxItems={3} />)

    // Should only render 3 items
    const statusElements = container.querySelectorAll('[class*="rounded text-xs"]')
    expect(statusElements).toHaveLength(3)
  })
})
