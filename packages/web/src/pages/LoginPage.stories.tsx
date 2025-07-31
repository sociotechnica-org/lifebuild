import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage.js'

// Mock AuthContext for Storybook
const MockAuthProvider = ({
  children,
  mockProps,
}: {
  children: React.ReactNode
  mockProps: any
}) => {
  const mockAuthContext = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    login: async (email: string, password: string) => {
      console.log('Mock login attempt:', { email, password })
      return Promise.resolve(true)
    },
    logout: async () => Promise.resolve(),
    ...mockProps,
  }

  return React.createElement(
    'div',
    {
      children,
      // Provide mock context through a fake provider
      'data-mock-auth': JSON.stringify(mockAuthContext),
    },
    children
  )
}

// Create a story wrapper that doesn't depend on real AuthContext
const LoginPageStory = ({
  isDevelopmentMode = true,
  hasSuccessMessage = false,
  isAuthLoading = false,
  isAuthenticated = false,
}: {
  isDevelopmentMode?: boolean
  hasSuccessMessage?: boolean
  isAuthLoading?: boolean
  isAuthenticated?: boolean
}) => {
  // Mock the environment and URL params
  const searchParams = new URLSearchParams()
  if (hasSuccessMessage) {
    searchParams.set('message', 'Account created successfully. Please sign in.')
  }

  React.useEffect(() => {
    // Mock environment variables
    ;(import.meta as any).env = {
      ...import.meta.env,
      DEV: isDevelopmentMode,
      VITE_REQUIRE_AUTH: isDevelopmentMode ? 'false' : 'true',
    }
  }, [isDevelopmentMode])

  return (
    <MemoryRouter initialEntries={[`/login?${searchParams.toString()}`]}>
      <MockAuthProvider mockProps={{ isLoading: isAuthLoading, isAuthenticated }}>
        <div className='min-h-screen'>
          <LoginPage />
        </div>
      </MockAuthProvider>
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
    isAuthLoading: {
      control: 'boolean',
      description: 'Shows loading state during authentication',
    },
    isAuthenticated: {
      control: 'boolean',
      description: 'Whether user is already authenticated (would redirect)',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isDevelopmentMode: true,
    hasSuccessMessage: false,
    isAuthLoading: false,
    isAuthenticated: false,
  },
}

export const ProductionMode: Story = {
  args: {
    isDevelopmentMode: false,
    hasSuccessMessage: false,
    isAuthLoading: false,
    isAuthenticated: false,
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
    isAuthLoading: false,
    isAuthenticated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Login page showing success message after successful signup.',
      },
    },
  },
}

export const Loading: Story = {
  args: {
    isDevelopmentMode: true,
    hasSuccessMessage: false,
    isAuthLoading: true,
    isAuthenticated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Login page in loading state during authentication check.',
      },
    },
  },
}

export const FormValidation: Story = {
  args: {
    isDevelopmentMode: true,
    hasSuccessMessage: false,
    isAuthLoading: false,
    isAuthenticated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Try submitting the form with invalid credentials to see error handling.',
      },
    },
  },
}
