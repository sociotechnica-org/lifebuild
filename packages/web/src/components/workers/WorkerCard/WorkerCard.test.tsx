import React from 'react'
import { render, screen, waitFor } from '../../../../tests/test-utils.js'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { WorkerCard } from './WorkerCard.js'
import { DEFAULT_MODEL } from '@lifebuild/shared'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = {
    query: vi.fn().mockResolvedValue([]),
    commit: vi.fn(),
  }
  return { mockStore }
})

// Mock livestore-compat (components import from this, not @livestore/react)
vi.mock('../../../livestore-compat.js', () => ({
  useStore: () => ({ store: mockStore }),
  useQuery: vi.fn(() => []),
}))

// Mock system prompt templates
vi.mock('../../src/utils/workerNames.js', () => ({
  systemPromptTemplates: [],
}))

describe('WorkerCard', () => {
  const mockWorker = {
    id: 'test-worker',
    name: 'Test Worker',
    roleDescription: 'Test Role',
    systemPrompt: 'Test system prompt',
    avatar: '🤖',
    defaultModel: DEFAULT_MODEL,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    roomId: null,
    roomKind: null,
    status: 'active',
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render default avatar when none provided', async () => {
    const workerWithoutAvatar = { ...mockWorker, avatar: null }
    render(
      <BrowserRouter>
        <WorkerCard worker={workerWithoutAvatar} />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('🤖')).toBeInTheDocument()
    })
  })

  it('should call onClick when card is clicked', async () => {
    const onClick = vi.fn()
    render(
      <BrowserRouter>
        <WorkerCard worker={mockWorker} onClick={onClick} />
      </BrowserRouter>
    )

    await waitFor(() => {
      const card = screen.getByText('Test Worker').closest('div')
      card?.click()
    })

    expect(onClick).toHaveBeenCalledOnce()
  })
})
