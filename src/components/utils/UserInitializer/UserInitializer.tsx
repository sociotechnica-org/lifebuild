import React, { useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getUsers$ } from '../../../livestore/queries.js'
import { events } from '../../../livestore/schema.js'

interface UserInitializerProps {
  children: React.ReactNode
}

// Global flag to prevent multiple initialization attempts across component instances
let globalInitializationAttempted = false

export const UserInitializer: React.FC<UserInitializerProps> = ({ children }) => {
  const { store } = useStore()
  const users = useQuery(getUsers$)

  useEffect(() => {
    const initializeUser = async () => {
      // Only attempt initialization once and only when users query has loaded
      if (globalInitializationAttempted || users === undefined) {
        return
      }

      // If users exist, no need to initialize
      if (users.length > 0) {
        return
      }

      // Mark that we're attempting initialization to prevent race conditions
      globalInitializationAttempted = true

      try {
        console.log('No users found, creating default user')

        await store.commit(
          events.userCreated({
            id: crypto.randomUUID(),
            name: 'Default User',
            avatarUrl: undefined,
            createdAt: new Date(),
          })
        )
      } catch (error) {
        console.error('Failed to create default user:', error)
        // Reset the flag so we can retry on next render if needed
        globalInitializationAttempted = false
      }
    }

    initializeUser()
  }, [users, store])

  // Always render children - don't block on initialization
  return <>{children}</>
}

// Export function to reset global state (for testing)
export const resetUserInitializationState = () => {
  globalInitializationAttempted = false
}
