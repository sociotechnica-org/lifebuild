import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import {
  AuthStatusBannerPresenter,
  type AuthStatusBannerPresenterProps,
} from './AuthStatusBanner.js'

const meta: Meta<typeof AuthStatusBannerPresenter> = {
  title: 'Components/Auth/AuthStatusBanner',
  component: AuthStatusBannerPresenter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Displays the current authentication status above the main navigation. Shows reconnecting, warning, or error messaging with optional retry/log out actions.',
      },
    },
  },
  args: {
    description: 'We paused real-time updates while we renew your session.',
    title: 'Refreshing your session…',
    variant: 'info',
  },
  render: (props: AuthStatusBannerPresenterProps) => (
    <div className='bg-gray-100 py-8'>
      <AuthStatusBannerPresenter {...props} />
    </div>
  ),
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Reconnecting: Story = {
  args: {
    variant: 'info',
    title: 'Refreshing your session…',
    description: 'We paused real-time updates while we renew your session.',
    isReconnecting: true,
    showRetry: false,
    showLogout: false,
  },
}

export const AuthError: Story = {
  args: {
    variant: 'error',
    title: 'Signed out — refresh required',
    description: 'We could not refresh your session automatically.',
    authErrorCode: 'TOKEN_EXPIRED',
    rawAuthError: 'TOKEN_EXPIRED: Unable to refresh token',
    showRetry: false,
    showLogout: true,
  },
}

export const WarningCanRetry: Story = {
  args: {
    variant: 'warning',
    title: 'Hold on — session needs attention',
    description: 'We could not find a valid session token. Please try again.',
    authErrorCode: 'TOKEN_MISSING',
    rawAuthError: 'TOKEN_MISSING: Unable to retrieve access token for sync',
    showRetry: true,
    showLogout: true,
  },
}
