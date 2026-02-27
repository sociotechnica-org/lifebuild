import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, createMockProject } from '../../../tests/test-utils.js'
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

  it('links Drafting lifecycle badge to the stage route', () => {
    const project = createMockProject({
      id: 'proj-123',
      projectLifecycleState: { status: 'planning', stage: 2 },
    })

    render(<ProjectHeader project={project} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open Drafting Stage 2' }))

    expect(mockNavigate).toHaveBeenCalledWith(
      '/drafting-room/proj-123/stage2?storeId=test-store-123'
    )
  })

  it('does not render a Drafting stage link badge for non-planning projects', () => {
    const project = createMockProject({
      id: 'proj-123',
      projectLifecycleState: { status: 'active', stage: 2 },
    })

    render(<ProjectHeader project={project} />)

    expect(screen.queryByRole('button', { name: /Open Drafting Stage/i })).toBeNull()
  })
})
