import React from 'react'
import { useChatData } from '../../../hooks/useChatData.js'
import { ChatPresenter } from '../ChatPresenter/ChatPresenter.js'

/**
 * Container component that handles all data fetching and LiveStore integration
 * Passes data down to ChatPresenter for presentation
 */
export const ChatInterface: React.FC = () => {
  const chatData = useChatData()

  return <ChatPresenter {...chatData} />
}
