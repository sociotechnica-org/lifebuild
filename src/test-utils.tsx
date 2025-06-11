import '@testing-library/jest-dom'
import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import type { Task, Column, Board } from './livestore/schema.js'

// Simple test wrapper for basic component testing
interface TestProviderProps {
  children: React.ReactNode
}

function TestProvider({ children }: TestProviderProps) {
  // Simple wrapper for now - can be enhanced later for LiveStore
  return <div data-testid='test-wrapper'>{children}</div>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, {
    wrapper: ({ children }) => <TestProvider>{children}</TestProvider>,
    ...options,
  })
}

// Mock createTestStore for tests that expect it
const createTestStore = () => {
  return {
    mutate: () => Promise.resolve(undefined),
    query: () => [],
    subscribe: () => () => {},
  }
}

// Factory functions for creating test data
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-task',
  boardId: 'test-board',
  columnId: 'test-column',
  title: 'Test Task',
  description: null,
  position: 0,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
})

export const createMockColumn = (overrides: Partial<Column> = {}): Column => ({
  id: 'test-column',
  boardId: 'test-board',
  name: 'Test Column',
  position: 0,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  ...overrides,
})

export const createMockBoard = (overrides: Partial<Board> = {}): Board => ({
  id: 'test-board',
  name: 'Test Board',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  deletedAt: null,
  ...overrides,
})

// Helper to create multiple tasks with sequential IDs and positions
export const createMockTasks = (count: number, baseOverrides: Partial<Task> = {}): Task[] => {
  return Array.from({ length: count }, (_, index) =>
    createMockTask({
      id: `task-${index + 1}`,
      title: `Task ${index + 1}`,
      position: index,
      ...baseOverrides,
    })
  )
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, createTestStore }
