import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { WorkerCard } from './WorkerCard.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = {
    query: vi.fn().mockResolvedValue([]),
    commit: vi.fn(),
  }
  return { mockStore }
})

// Mock @livestore/react
vi.mock('@livestore/react', () => ({
  useStore: () => ({ store: mockStore }),
}))

// Mock system prompt templates
vi.mock('../../src/util/workerNames.js', () => ({
  systemPromptTemplates: [],
}))

describe('WorkerCard', () => {
  const mockWorker = {
    id: 'test-worker',
    name: 'Test Worker',
    roleDescription: 'Test Role',
    systemPrompt: 'Test system prompt',
    avatar: '🤖',
    defaultModel: 'claude-3-5-sonnet-latest',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
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
