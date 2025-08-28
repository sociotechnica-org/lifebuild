import { describe, expect, it } from 'vitest'
import { ChatInterface } from './ChatInterface.js'
import { ChatPresenter } from '../ChatPresenter/ChatPresenter.js'

// Simple unit test to verify the re-export works correctly
describe('ChatInterface', () => {
  it('should re-export ChatPresenter as ChatInterface', () => {
    expect(ChatInterface).toBe(ChatPresenter)
  })
})
