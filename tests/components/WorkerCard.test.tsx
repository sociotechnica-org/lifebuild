import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { WorkerCard } from '../../src/components/WorkerCard.js'

// Hoisted mocks
const { mockStore } = vi.hoisted(() => {
  const mockStore = { commit: vi.fn() }
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
    createdAt: new Date('2023-01-01'),
    isActive: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render default avatar when none provided', () => {
    const workerWithoutAvatar = { ...mockWorker, avatar: null }
    render(<WorkerCard worker={workerWithoutAvatar} />)
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn()
    render(<WorkerCard worker={mockWorker} onClick={onClick} />)

    const card = screen.getByText('Test Worker').closest('div')
    card?.click()

    expect(onClick).toHaveBeenCalledOnce()
  })
})
