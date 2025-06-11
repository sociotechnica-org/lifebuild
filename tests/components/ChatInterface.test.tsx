import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ChatInterface } from '../../src/components/ChatInterface.js'

// Mock the LiveStore hooks
vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(() => []),
  useStore: vi.fn(() => ({
    store: {
      commit: vi.fn(),
    },
  })),
}))

describe('ChatInterface', () => {
  it('should render basic UI elements', () => {
    render(<ChatInterface />)

    expect(screen.getByText('LLM Chat')).toBeInTheDocument()
    expect(screen.getByLabelText('New Chat')).toBeInTheDocument()
    expect(screen.getByText('No conversation selected')).toBeInTheDocument()
  })
})
