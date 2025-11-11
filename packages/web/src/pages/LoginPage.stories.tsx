import React, { useEffect } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { LoginPage } from './LoginPage.js'

// Story wrapper that simulates URL search params without additional Router
const LoginPageStory = ({ hasSuccessMessage = false }: { hasSuccessMessage?: boolean }) => {
  useEffect(() => {
    // Simulate search params for Storybook by temporarily modifying URL
    const originalUrl = window.location.href
    const url = new URL(window.location.href)

    if (hasSuccessMessage) {
      url.searchParams.set('message', 'Account created successfully. Please sign in.')
    } else {
      url.searchParams.delete('message')
    }

    // Update URL without triggering navigation
    window.history.replaceState({}, '', url.toString())

    // Cleanup on unmount
    return () => {
      window.history.replaceState({}, '', originalUrl)
    }
  }, [hasSuccessMessage])

  return (
    <div className='min-h-screen'>
      <LoginPage />
    </div>
  )
}

const meta: Meta<typeof LoginPageStory> = {
  title: 'Components/Pages/LoginPage',
  component: LoginPageStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Login page with email/password authentication, dev mode indicator, and redirect handling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    hasSuccessMessage: {
      control: 'boolean',
      description: 'Shows success message from signup redirect',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    hasSuccessMessage: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default login page with current environment settings.',
      },
    },
  },
}

export const WithSuccessMessage: Story = {
  args: {
    hasSuccessMessage: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Login page showing success message after successful signup.',
      },
    },
  },
}

export const FormValidation: Story = {
  args: {
    hasSuccessMessage: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Try submitting the form with invalid credentials to see error handling.',
      },
    },
  },
}
