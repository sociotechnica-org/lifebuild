import React, { useEffect, useRef } from 'react'
import { useAuth } from '../../../contexts/AuthContext.js'
import { useStore, useQuery } from '@livestore/react'
import { events } from '@lifebuild/shared/schema'
import { getUsers$ } from '@lifebuild/shared/queries'

interface AuthUserSyncProps {
  children: React.ReactNode
}

export const AuthUserSync: React.FC<AuthUserSyncProps> = ({ children }) => {
  const { user: authUser } = useAuth()
  const { store } = useStore()
  const users = useQuery(getUsers$)
  const lastSyncedUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    const syncAuthUser = async () => {
      // Skip if no auth user or users query hasn't loaded
      if (!authUser || users === undefined) {
        return
      }

      // Skip if we've already synced this user
      if (lastSyncedUserIdRef.current === authUser.id) {
        return
      }

      // Check if user already exists in LiveStore
      const existingUser = users.find(u => u.id === authUser.id)

      // If user doesn't exist or needs updating, sync them
      if (
        !existingUser ||
        existingUser.email !== authUser.email ||
        existingUser.name !== authUser.email
      ) {
        try {
          console.log('Syncing authenticated user to LiveStore:', authUser.id)

          await store.commit(
            events.userSynced({
              id: authUser.id,
              email: authUser.email,
              name: authUser.email, // Use email as name for now
              avatarUrl: undefined,
              isAdmin: authUser.isAdmin,
              syncedAt: new Date(),
            })
          )

          lastSyncedUserIdRef.current = authUser.id
        } catch (error) {
          console.error('Failed to sync authenticated user:', error)
        }
      } else {
        // Mark as synced even if no update was needed
        lastSyncedUserIdRef.current = authUser.id
      }
    }

    syncAuthUser()
  }, [authUser, users, store])

  return <>{children}</>
}
