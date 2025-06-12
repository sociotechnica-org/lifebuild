import { queryDb } from '@livestore/livestore'
import { useQuery, useStore } from '@livestore/react'
import React from 'react'

import { events, tables, type ChatMessage } from '../livestore/schema.js'

const chatMessages$ = queryDb(
  _get => {
    return tables.chatMessages.select()
  },
  { label: 'chatMessages' }
)

export const MainSection: React.FC = () => {
  const { store } = useStore()

  const handleSendChatMessage = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const formData = new FormData(event.target as HTMLFormElement)
      const message = formData.get('message') as string
      store.commit(
        events.chatMessageSent({
          id: crypto.randomUUID(),
          conversationId: 'main-section-chat', // Legacy chat in main section
          message,
          role: 'user',
          createdAt: new Date(),
        })
      )
    },
    [store]
  )

  const chatMessages = useQuery(chatMessages$) ?? []

  return (
    <section className='chat-container'>
      <ul className='chat-messages'>
        {chatMessages.map((message: ChatMessage) => (
          <li key={message.id}>{message.message}</li>
        ))}
      </ul>
      <form onSubmit={handleSendChatMessage}>
        <input type='text' name='message' placeholder='Type your message...' />
        <button type='submit'>Send</button>
      </form>
    </section>
  )
}
