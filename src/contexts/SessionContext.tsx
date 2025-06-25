import React, { createContext, useContext } from 'react'

interface SessionContextType {
  sessionId: string
}

const SessionContext = createContext<SessionContextType | undefined>(undefined)

interface SessionProviderProps {
  sessionId: string
  children: React.ReactNode
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ sessionId, children }) => {
  return <SessionContext.Provider value={{ sessionId }}>{children}</SessionContext.Provider>
}

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext)
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
