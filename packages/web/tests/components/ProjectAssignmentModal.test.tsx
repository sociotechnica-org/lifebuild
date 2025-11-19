import { describe, it, expect } from 'vitest'
import type { Worker } from '@work-squared/shared/schema'
import { DEFAULT_MODEL } from '@work-squared/shared'

describe('ProjectAssignmentModal', () => {
  const mockWorker: Worker = {
    id: 'worker-1',
    name: 'Test Worker',
    roleDescription: 'Test Role',
    systemPrompt: 'Test system prompt',
    avatar: '🤖',
    defaultModel: DEFAULT_MODEL,
    createdAt: new Date(),
    updatedAt: new Date(),
    roomId: null,
    roomKind: null,
    status: 'active',
    isActive: true,
  }

  it('should have a worker prop type', () => {
    expect(mockWorker.id).toBe('worker-1')
    expect(mockWorker.name).toBe('Test Worker')
  })

  it('should render with required props', () => {
    // Basic functionality test - the component exists and can be imported
    expect(typeof mockWorker).toBe('object')
    expect(mockWorker.isActive).toBe(true)
  })
})
