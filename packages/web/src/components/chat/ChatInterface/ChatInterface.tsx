import React from 'react'
import { useChatData } from '../../../hooks/useChatData.js'
import { ChatPresenter } from '../ChatPresenter/ChatPresenter.js'

/**
 * Container component that handles all data fetching and LiveStore integration
 * Passes data down to ChatPresenter for presentation
 */
interface ChatInterfaceProps {
  onClose?: () => void
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
  const chatData = useChatData()

  return <ChatPresenter {...chatData} onClose={onClose} />
}
