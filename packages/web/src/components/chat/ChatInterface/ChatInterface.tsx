import React from 'react'
import { useChatData } from '../../../hooks/useChatData.js'
import { ChatPresenter } from '../ChatPresenter/ChatPresenter.js'

/**
 * Clean ChatInterface using container/presenter pattern
 *
 * This component is now a simple container that:
 * 1. Uses the custom hook to manage all data and state
 * 2. Passes everything to a pure presenter component
 *
 * Benefits:
 * - Separation of concerns (data vs UI)
 * - Easier testing (can test presenter with mock data)
 * - Better performance (memoized data processing prevents infinite loops)
 * - Cleaner code organization
 */
export const ChatInterface: React.FC = () => {
  const chatData = useChatData()

  return <ChatPresenter {...chatData} />
}
