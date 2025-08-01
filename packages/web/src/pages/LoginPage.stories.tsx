import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage.js'

// Mock environment variables
const mockEnv = (isDevelopmentMode: boolean) => {
  // Mock the import.meta.env object
  Object.defineProperty(window, '__vite_env__', {
    value: {
      DEV: isDevelopmentMode,
      VITE_REQUIRE_AUTH: isDevelopmentMode ? 'false' : 'true',
      VITE_AUTH_SERVICE_URL: 'http://localhost:8788',
    },
    writable: true,
  })
}

// Create a story wrapper that uses the default AuthProvider from preview
const LoginPageStory = ({
  isDevelopmentMode = true,
  hasSuccessMessage = false,
}: {
  isDevelopmentMode?: boolean
  hasSuccessMessage?: boolean
}) => {
  // Mock the environment and URL params
  const searchParams = new URLSearchParams()
  if (hasSuccessMessage) {
    searchParams.set('message', 'Account created successfully. Please sign in.')
  }

  React.useEffect(() => {
    mockEnv(isDevelopmentMode)
  }, [isDevelopmentMode])

  return (
    <MemoryRouter initialEntries={[`/login?${searchParams.toString()}`]}>
      <div className='min-h-screen'>
        <LoginPage />
      </div>
    </MemoryRouter>
  )
}

const meta: Meta<typeof LoginPageStory> = {
  title: 'Pages/LoginPage',
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
    isDevelopmentMode: {
      control: 'boolean',
      description: 'Shows dev mode indicator when true',
    },
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
    isDevelopmentMode: true,
    hasSuccessMessage: false,
  },
}

export const ProductionMode: Story = {
  args: {
    isDevelopmentMode: false,
    hasSuccessMessage: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Login page in production mode without the dev mode indicator.',
      },
    },
  },
}

export const WithSuccessMessage: Story = {
  args: {
    isDevelopmentMode: true,
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
    isDevelopmentMode: true,
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
