import '@testing-library/jest-dom'
import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import type { Project } from '@lifebuild/shared/schema'

// Note: livestore-compat.js is aliased to @livestore/react in vitest.config.ts
// This allows tests that mock @livestore/react to work correctly with components
// that import from livestore-compat.js

// Simple test wrapper - no LiveStoreProvider needed since tests mock the hooks
interface TestProviderProps {
  children: React.ReactNode
}

function TestProvider({ children }: TestProviderProps) {
  return <div data-testid='test-wrapper'>{children}</div>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, {
    wrapper: ({ children }) => <TestProvider>{children}</TestProvider>,
    ...options,
  })
}

// Factory functions for creating test data
export const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'test-project',
  name: 'Test Project',
  description: null,
  category: null,
  attributes: null,
  projectLifecycleState: null,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01'),
  deletedAt: null,
  archivedAt: null,
  ...overrides,
})

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }
