import React, { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useStore } from '@livestore/react'
import { events } from '../../../livestore/schema.js'

interface SnackbarData {
  message: string
  type: string
  actionLabel?: string
  actionData?: Record<string, any>
  showUntil: Date
}

interface SnackbarContextType {
  showSnackbar: (data: Omit<SnackbarData, 'showUntil'> & { duration?: number }) => void
}

const SnackbarContext = createContext<SnackbarContextType | null>(null)

export function useSnackbar() {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider')
  }
  return context
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState<SnackbarData | null>(null)

  const showSnackbar = useCallback(
    (data: Omit<SnackbarData, 'showUntil'> & { duration?: number }) => {
      const duration = data.duration || 5000
      setSnackbar({
        ...data,
        showUntil: new Date(Date.now() + duration),
      })
    },
    []
  )

  const hideSnackbar = useCallback(() => {
    setSnackbar(null)
  }, [])

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <SnackbarComponent snackbar={snackbar} onHide={hideSnackbar} />
    </SnackbarContext.Provider>
  )
}

function SnackbarComponent({
  snackbar,
  onHide,
}: {
  snackbar: SnackbarData | null
  onHide: () => void
}) {
  const { store } = useStore()
  const [isVisible, setIsVisible] = useState(false)

  // Auto-hide snackbar when time expires
  useEffect(() => {
    if (!snackbar) return

    const now = Date.now()
    const timeLeft = snackbar.showUntil.getTime() - now

    if (timeLeft <= 0) {
      onHide()
      return
    }

    const timeout = setTimeout(() => {
      onHide()
    }, timeLeft)

    return () => clearTimeout(timeout)
  }, [snackbar, onHide])

  // Handle fade-in animation
  useEffect(() => {
    if (snackbar) {
      setIsVisible(false)
      const timer = setTimeout(() => setIsVisible(true), 10)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [snackbar])

  if (!snackbar) return null

  const handleAction = () => {
    if (snackbar.type === 'archive-undo' && snackbar.actionData?.taskId) {
      store.commit(
        events.taskUnarchived({
          taskId: snackbar.actionData.taskId as string,
        })
      )
    }
    onHide()
  }

  const handleClose = () => {
    onHide()
  }

  return (
    <div className='fixed bottom-4 left-4 right-4 flex justify-center z-50'>
      <div
        className={`bg-gray-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 max-w-md transition-all duration-100 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
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
