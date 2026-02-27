import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, createMockProject } from '../../../tests/test-utils.js'
import { ProjectHeader } from './ProjectHeader.js'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../livestore-compat.js', () => ({
  useQuery: () => [],
  useStore: () => ({ store: { commit: vi.fn() } }),
}))

vi.mock('../../contexts/AuthContext.js', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}))

describe('ProjectHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { search: '?storeId=test-store-123' },
      writable: true,
    })
  })

  it('renders planning lifecycle badge as non-interactive text', () => {
    const project = createMockProject({
      id: 'proj-123',
      projectLifecycleState: { status: 'planning', stage: 2 },
    })

    render(<ProjectHeader project={project} />)

    expect(screen.getByText(/stage 2/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Open Drafting Stage/i })).toBeNull()
  })

  it('does not render a lifecycle badge button for non-planning projects', () => {
    const project = createMockProject({
      id: 'proj-123',
      projectLifecycleState: { status: 'active', stage: 2 },
    })

    render(<ProjectHeader project={project} />)

    expect(screen.queryByRole('button', { name: /stage/i })).toBeNull()
  })
})
