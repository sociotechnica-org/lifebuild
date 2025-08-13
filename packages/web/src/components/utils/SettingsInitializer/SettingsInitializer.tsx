import React, { useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getAllSettings$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { DEFAULT_SETTINGS } from '@work-squared/shared'

interface SettingsInitializerProps {
  children: React.ReactNode
}

// Global flag to prevent multiple initialization attempts across component instances
let globalSettingsInitializationAttempted = false

export const SettingsInitializer: React.FC<SettingsInitializerProps> = ({ children }) => {
  const { store } = useStore()
  const settings = useQuery(getAllSettings$)

  useEffect(() => {
    const initializeSettings = async () => {
      // Only attempt initialization once and only when settings query has loaded
      if (globalSettingsInitializationAttempted || settings === undefined) {
        return
      }

      // Convert settings array to a map for easier checking
      const settingsMap: Record<string, string> = {}
      settings.forEach(setting => {
        settingsMap[setting.key] = setting.value
      })

      // Check which default settings are missing
      const missingSettings: Array<{ key: string; value: string }> = []

      Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
        if (!(key in settingsMap)) {
          missingSettings.push({ key, value })
        }
      })

      // If all settings exist, no need to initialize
      if (missingSettings.length === 0) {
        return
      }

      // Mark that we're attempting initialization to prevent race conditions
      globalSettingsInitializationAttempted = true

      try {
        console.log(`Initializing ${missingSettings.length} default settings`)

        const events_to_commit = missingSettings.map(({ key, value }) =>
          events.settingUpdated({ key, value, updatedAt: new Date() })
        )

        await Promise.all(events_to_commit.map(event => store.commit(event)))
      } catch (error) {
        console.error('Failed to initialize default settings:', error)
        // Reset the flag so we can retry on next render if needed
        globalSettingsInitializationAttempted = false
      }
    }

    initializeSettings()
  }, [settings, store])

  // Always render children - don't block on initialization
  return <>{children}</>
}

// Export function to reset global state (for testing)
export const resetSettingsInitializationState = () => {
  globalSettingsInitializationAttempted = false
}
