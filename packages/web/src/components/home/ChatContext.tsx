import React, { createContext, useContext } from 'react'

interface ChatContextValue {
  isChatOpen: boolean
}

const ChatContext = createContext<ChatContextValue | null>(null)

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    return { isChatOpen: false }
  }
  return context
}

export const ChatProvider: React.FC<{ children: React.ReactNode; isChatOpen: boolean }> = ({
  children,
  isChatOpen,
}) => {
  return <ChatContext.Provider value={{ isChatOpen }}>{children}</ChatContext.Provider>
}
