import { describe, expect, it, vi } from 'vitest'
import { sendDiscordNotification } from '../utils/discord.js'

describe('sendDiscordNotification', () => {
  it('posts message to webhook url', async () => {
    const webhookUrl = 'https://discord.com/api/webhooks/test'
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(null, { status: 204 }))

    await sendDiscordNotification('hello', webhookUrl)

    expect(fetchMock).toHaveBeenCalledWith(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello' }),
    })

    fetchMock.mockRestore()
  })

  it('does nothing without webhook url', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')

    await sendDiscordNotification('hello')

    expect(fetchMock).not.toHaveBeenCalled()

    fetchMock.mockRestore()
  })
})
