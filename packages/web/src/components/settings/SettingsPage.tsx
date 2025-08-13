import React, { useState, useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getAllSettings$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { SETTINGS_KEYS, DEFAULT_SETTINGS } from '@work-squared/shared'
import { SystemPromptEditor } from './SystemPromptEditor.js'
import { LoadingSpinner } from '../ui/LoadingSpinner.js'

export const SettingsPage: React.FC = () => {
  const { store } = useStore()
  const allSettings = useQuery(getAllSettings$) ?? []
  const [instanceName, setInstanceName] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Convert settings array to a map for easier access
  const settingsMap = React.useMemo(() => {
    const map: Record<string, string> = {}
    allSettings.forEach(setting => {
      map[setting.key] = setting.value
    })
    return map
  }, [allSettings])

  // Initialize form values from settings or defaults
  useEffect(() => {
    const currentInstanceName =
      settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
    const currentSystemPrompt =
      settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]

    setInstanceName(currentInstanceName)
    setSystemPrompt(currentSystemPrompt)
  }, [settingsMap])

  // Track changes
  useEffect(() => {
    const originalInstanceName =
      settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
    const originalSystemPrompt =
      settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]

    const hasInstanceNameChanged = instanceName !== originalInstanceName
    const hasSystemPromptChanged = systemPrompt !== originalSystemPrompt

    setHasChanges(hasInstanceNameChanged || hasSystemPromptChanged)
  }, [instanceName, systemPrompt, settingsMap])

  const handleSave = async () => {
    if (!hasChanges) return

    setIsSubmitting(true)
    try {
      const updates = []

      // Update instance name if changed
      const originalInstanceName =
        settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
      if (instanceName !== originalInstanceName) {
        updates.push(
          events.settingUpdated({
            key: SETTINGS_KEYS.INSTANCE_NAME,
            value: instanceName,
            updatedAt: new Date(),
          })
        )
      }

      // Update system prompt if changed
      const originalSystemPrompt =
        settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]
      if (systemPrompt !== originalSystemPrompt) {
        updates.push(
          events.settingUpdated({
            key: SETTINGS_KEYS.SYSTEM_PROMPT,
            value: systemPrompt,
            updatedAt: new Date(),
          })
        )
      }

      if (updates.length > 0) {
        await Promise.all(updates.map(update => store.commit(update)))
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setInstanceName(DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME])
    setSystemPrompt(DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT])
  }

  const handleDiscard = () => {
    const originalInstanceName =
      settingsMap[SETTINGS_KEYS.INSTANCE_NAME] || DEFAULT_SETTINGS[SETTINGS_KEYS.INSTANCE_NAME]
    const originalSystemPrompt =
      settingsMap[SETTINGS_KEYS.SYSTEM_PROMPT] || DEFAULT_SETTINGS[SETTINGS_KEYS.SYSTEM_PROMPT]

    setInstanceName(originalInstanceName)
    setSystemPrompt(originalSystemPrompt)
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
        <div className='space-y-6'>
          {/* Header */}
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Settings</h1>
            <p className='mt-2 text-gray-600'>Configure your Work Squared instance</p>
          </div>

          {/* Settings Form */}
          <div className='bg-white shadow rounded-lg'>
            <div className='px-6 py-6 space-y-8'>
              {/* Instance Name */}
              <div>
                <label
                  htmlFor='instance-name'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Instance Name
                </label>
                <p className='text-sm text-gray-500 mb-3'>
                  The name displayed for your Work Squared instance
                </p>
                <input
                  type='text'
                  id='instance-name'
                  value={instanceName}
                  onChange={e => setInstanceName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Enter instance name'
                />
              </div>

              {/* System Prompt */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Global System Prompt
                </label>
                <p className='text-sm text-gray-500 mb-3'>
                  The default system prompt used for all AI chats (unless overridden by a specific
                  worker)
                </p>
                <SystemPromptEditor value={systemPrompt} onChange={setSystemPrompt} />
              </div>
            </div>

            {/* Actions */}
            <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center'>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={handleReset}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                >
                  Reset to Defaults
                </button>
                {hasChanges && (
                  <button
                    type='button'
                    onClick={handleDiscard}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  >
                    Discard Changes
                  </button>
                )}
              </div>

              <button
                type='button'
                onClick={handleSave}
                disabled={!hasChanges || isSubmitting}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  hasChanges && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <div className='flex items-center'>
                    <div className='mr-2'>
                      <LoadingSpinner size='sm' />
                    </div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
