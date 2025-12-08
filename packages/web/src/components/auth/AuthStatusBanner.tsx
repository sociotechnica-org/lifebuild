import React, { useCallback, useMemo, useState } from 'react'
import { ConnectionState } from '@lifebuild/shared/auth'
import { useAuth } from '../../contexts/AuthContext.js'
import { useSyncPayload } from '../../hooks/useSyncPayload.js'
import { LoadingSpinner } from '../ui/LoadingSpinner.js'
import { getStoreIdFromUrl } from '../../utils/navigation.js'

const DEFAULT_INSTANCE_ID = 'ui-session-status'

type AuthStatusBannerVariant = 'info' | 'warning' | 'error'

const VARIANT_STYLES: Record<
  AuthStatusBannerVariant,
  { container: string; title: string; description: string }
> = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-900',
    title: 'text-blue-900',
    description: 'text-blue-800',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    title: 'text-amber-900',
    description: 'text-amber-800',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-900',
    title: 'text-red-900',
    description: 'text-red-800',
  },
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  TOKEN_MISSING: 'We could not find a valid session token. Please try again.',
  TOKEN_INVALID: 'Your session token is no longer valid.',
  TOKEN_EXPIRED: 'Your session token expired before we could refresh it.',
  TOKEN_MALFORMED: 'Your session token looks malformed.',
}

const getInstanceId = (): string => {
  if (typeof window === 'undefined') {
    return DEFAULT_INSTANCE_ID
  }

  const fromUrl = getStoreIdFromUrl()
  if (fromUrl) {
    return fromUrl
  }

  const stored = window.localStorage.getItem('storeId')
  return stored || DEFAULT_INSTANCE_ID
}

const getAuthErrorCode = (rawError?: string): string | undefined => {
  if (!rawError) {
    return undefined
  }
  const trimmed = rawError.trim()
  if (!trimmed) {
    return undefined
  }
  const [code] = trimmed.split(':')
  return code
}

const describeAuthError = (code?: string, fallback?: string): string => {
  if (!code) {
    return fallback || 'Your session needs attention.'
  }

  const message = AUTH_ERROR_MESSAGES[code]
  if (message) {
    return message
  }

  return fallback || 'We could not refresh your session automatically.'
}

export interface AuthStatusBannerPresenterProps {
  variant: AuthStatusBannerVariant
  title: string
  description: string
  authErrorCode?: string
  rawAuthError?: string
  isReconnecting?: boolean
  showRetry?: boolean
  showLogout?: boolean
  isRetrying?: boolean
  isLoggingOut?: boolean
  onRetry?: () => void
  onLogout?: () => void
}

export const AuthStatusBannerPresenter: React.FC<AuthStatusBannerPresenterProps> = ({
  variant,
  title,
  description,
  authErrorCode,
  rawAuthError,
  isReconnecting = false,
  showRetry = false,
  showLogout = true,
  isRetrying = false,
  isLoggingOut = false,
  onRetry,
  onLogout,
}) => {
  const styles = VARIANT_STYLES[variant]

  return (
    <div className={`border-b ${styles.container}`}>
      <div className='mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8'>
        <div className='flex items-start gap-3'>
          {isReconnecting ? (
            <div className='mt-1'>
              <LoadingSpinner size='sm' color='secondary' />
            </div>
          ) : (
            <span
              aria-hidden='true'
              className='mt-1 inline-flex h-3 w-3 rounded-full bg-current opacity-70'
            />
          )}
          <div className='space-y-1 text-sm'>
            <p className={`font-medium ${styles.title}`}>
              {title}
              {authErrorCode && !isReconnecting ? (
                <span className='ml-2 font-normal opacity-80'>({authErrorCode})</span>
              ) : null}
            </p>
            <p className={`${styles.description}`}>
              {description}
              {rawAuthError && rawAuthError !== authErrorCode && !isReconnecting ? (
                <span className='ml-1 opacity-70'>({rawAuthError})</span>
              ) : null}
            </p>
          </div>
        </div>

        {showRetry || showLogout ? (
          <div className='flex shrink-0 items-center gap-2'>
            {showRetry ? (
              <button
                type='button'
                onClick={onRetry}
                disabled={isRetrying || isLoggingOut}
                className='inline-flex items-center gap-2 rounded-md border border-amber-500 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 shadow-sm transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {isRetrying ? <LoadingSpinner size='sm' color='secondary' /> : null}
                <span>{isRetrying ? 'Trying again…' : 'Try again'}</span>
              </button>
            ) : null}
            {showLogout ? (
              <button
                type='button'
                onClick={onLogout}
                disabled={isLoggingOut || isRetrying}
                className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                  variant === 'error'
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
                }`}
              >
                {isLoggingOut ? <LoadingSpinner size='sm' color='white' /> : null}
                <span>{isLoggingOut ? 'Signing out…' : 'Log out'}</span>
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export const AuthStatusBanner: React.FC = () => {
  const instanceId = useMemo(() => getInstanceId(), [])
  const { connectionState, isAuthenticated, refreshToken, logout } = useAuth()
  const { syncPayload, updateSyncPayload } = useSyncPayload({ instanceId })
  const [isRetrying, setIsRetrying] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const authErrorCode = useMemo(
    () => getAuthErrorCode(syncPayload.authError),
    [syncPayload.authError]
  )

  const isReconnecting = connectionState === ConnectionState.RECONNECTING
  const isErrorState = connectionState === ConnectionState.ERROR
  const shouldShow =
    isAuthenticated && (isReconnecting || isErrorState || syncPayload.authError !== undefined)

  const variant = isErrorState ? 'error' : isReconnecting ? 'info' : 'warning'

  const title = isReconnecting
    ? 'Refreshing your session…'
    : isErrorState
      ? 'Signed out — refresh required'
      : 'Hold on — session needs attention'

  const description = isReconnecting
    ? 'We paused real-time updates while we renew your session.'
    : isErrorState
      ? describeAuthError(authErrorCode, 'We could not refresh your session automatically.')
      : describeAuthError(authErrorCode, syncPayload.authError)

  const showRetry = !isReconnecting && !isErrorState && syncPayload.authError !== undefined
  const showLogout = !isReconnecting

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    try {
      await refreshToken()
      await updateSyncPayload()
    } catch (error) {
      console.error('Retrying token refresh failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }, [refreshToken, updateSyncPayload])

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error('Logout from auth banner failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }, [logout])

  if (!shouldShow) {
    return null
  }

  return (
    <AuthStatusBannerPresenter
      variant={variant}
      title={title}
      description={description}
      authErrorCode={authErrorCode}
      rawAuthError={syncPayload.authError}
      isReconnecting={isReconnecting}
      showRetry={showRetry}
      showLogout={showLogout}
      isRetrying={isRetrying}
      isLoggingOut={isLoggingOut}
      onRetry={showRetry ? handleRetry : undefined}
      onLogout={showLogout ? handleLogout : undefined}
    />
  )
}
