import React, { useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { app$ } from '../livestore/queries.js'
import { events } from '../livestore/schema.js'

export function Snackbar() {
  const { store } = useStore()
  const app = useQuery(app$)
  const snackbar = app?.snackbar
  
  console.log('Snackbar render - app:', app, 'snackbar:', snackbar)

  // Auto-hide snackbar when time expires
  useEffect(() => {
    if (!snackbar || !app) return

    const now = Date.now()
    const timeLeft = snackbar.showUntil.getTime() - now

    if (timeLeft <= 0) {
      // Already expired, hide immediately
      const newState = { newTodoText: app.newTodoText || '', filter: (app.filter || 'all') as const }
      store.commit(events.uiStateSet(newState))
      return
    }

    // Set timeout to hide when it expires
    const timeout = setTimeout(() => {
      // Get current app state when timeout fires
      const currentApp = store.query(app$)
      if (currentApp?.snackbar) {
        const newState = { newTodoText: currentApp.newTodoText || '', filter: (currentApp.filter || 'all') as const }
        store.commit(events.uiStateSet(newState))
      }
    }, timeLeft)

    return () => clearTimeout(timeout)
  }, [snackbar?.showUntil, store, app$])

  if (!snackbar) return null

  const handleAction = () => {
    if (snackbar.type === 'archive-undo' && snackbar.actionData?.taskId) {
      // Undo archive by unarchiving the task
      store.commit(
        events.taskUnarchived({
          taskId: snackbar.actionData.taskId as string,
        })
      )
    }

    // Hide snackbar after action - same pattern as handleClose
    const newState = { newTodoText: app?.newTodoText || '', filter: (app?.filter || 'all') as const }
    store.commit(events.uiStateSet(newState))
  }

  const handleClose = () => {
    console.log('handleClose called, current app state:', app)
    
    // Let's try the exact same pattern as the default value in schema
    const newState = { newTodoText: '', filter: 'all' as const }
    console.log('Setting new state:', newState)
    
    try {
      const event = events.uiStateSet(newState)
      console.log('Generated event:', event)
      store.commit(event)
      console.log('Committed successfully')
    } catch (error) {
      console.error('Error committing:', error)
    }
  }

  return (
    <div className='fixed bottom-4 left-4 right-4 flex justify-center z-50'>
      <div className='bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md'>
        <span className='flex-1 text-sm'>{snackbar.message}</span>
        <div className='flex items-center gap-2'>
          {snackbar.actionLabel && (
            <button
              onClick={handleAction}
              className='text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors'
            >
              {snackbar.actionLabel}
            </button>
          )}
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-300 transition-colors'
            aria-label='Close notification'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
