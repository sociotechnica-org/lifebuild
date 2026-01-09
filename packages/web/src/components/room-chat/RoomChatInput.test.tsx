import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '../../../tests/test-utils.js'
import { RoomChatInput } from './RoomChatInput.js'

describe('RoomChatInput', () => {
  it('submits when pressing Enter without shift', () => {
    const onSend = vi.fn()
    const { getByPlaceholderText } = render(
      <RoomChatInput value='Hello' onChange={() => {}} onSend={onSend} />
    )

    const textarea = getByPlaceholderText(/ask something/i)
    fireEvent.keyDown(textarea, { key: 'Enter' })

    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it('allows shift+enter without sending', () => {
    const onSend = vi.fn()
    const { getByPlaceholderText } = render(
      <RoomChatInput value='Hello' onChange={() => {}} onSend={onSend} />
    )

    const textarea = getByPlaceholderText(/ask something/i)
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })

    expect(onSend).not.toHaveBeenCalled()
  })
})
