import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkerCard } from '../../src/components/WorkerCard.js'

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

  it('should render worker name and role', () => {
    render(<WorkerCard worker={mockWorker} />)
    expect(screen.getByText('Test Worker')).toBeInTheDocument()
    expect(screen.getByText('Test Role')).toBeInTheDocument()
  })

  it('should render worker avatar', () => {
    render(<WorkerCard worker={mockWorker} />)
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('should render default avatar when none provided', () => {
    const workerWithoutAvatar = { ...mockWorker, avatar: null }
    render(<WorkerCard worker={workerWithoutAvatar} />)
    expect(screen.getByText('🤖')).toBeInTheDocument()
  })

  it('should render creation date and active status', () => {
    render(<WorkerCard worker={mockWorker} />)
    expect(screen.getByText(/Created:/)).toBeInTheDocument()
    expect(screen.getByText(/Status: Active/)).toBeInTheDocument()
  })

  it('should render inactive status when worker is not active', () => {
    const inactiveWorker = { ...mockWorker, isActive: false }
    render(<WorkerCard worker={inactiveWorker} />)
    expect(screen.getByText(/Status: Inactive/)).toBeInTheDocument()
  })

  it('should render Chat and Edit buttons', () => {
    render(<WorkerCard worker={mockWorker} />)
    expect(screen.getByRole('button', { name: 'Chat' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn()
    render(<WorkerCard worker={mockWorker} onClick={onClick} />)

    const card = screen.getByText('Test Worker').closest('div')
    card?.click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('should render without onClick handler', () => {
    expect(() => render(<WorkerCard worker={mockWorker} />)).not.toThrow()
  })

  it('should render without role description', () => {
    const workerWithoutRole = { ...mockWorker, roleDescription: null }
    render(<WorkerCard worker={workerWithoutRole} />)
    expect(screen.getByText('Test Worker')).toBeInTheDocument()
    expect(screen.queryByText('Test Role')).not.toBeInTheDocument()
  })
})
