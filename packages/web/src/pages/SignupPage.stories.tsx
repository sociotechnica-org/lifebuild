import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { SignupPage } from './SignupPage.js'

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
    login: async (_email: string, _password: string) => Promise.resolve(),
    logout: async () => Promise.resolve(),
    ...mockProps,
  }

  return React.createElement(
    'div',
    {
      children,
      'data-mock-auth': JSON.stringify(mockAuthContext),
    },
    children
  )
}

// Create a story wrapper that doesn't depend on real AuthContext
const SignupPageStory = ({
  isDevelopmentMode = true,
  isAuthLoading = false,
  isAuthenticated = false,
}: {
  isDevelopmentMode?: boolean
  isAuthLoading?: boolean
  isAuthenticated?: boolean
}) => {
  React.useEffect(() => {
    // Mock environment variables
    ;(import.meta as any).env = {
      ...import.meta.env,
      DEV: isDevelopmentMode,
      VITE_REQUIRE_AUTH: isDevelopmentMode ? 'false' : 'true',
      VITE_AUTH_SERVICE_URL: 'http://localhost:8788',
    }
  }, [isDevelopmentMode])

  return (
    <MemoryRouter initialEntries={['/signup']}>
      <MockAuthProvider mockProps={{ isLoading: isAuthLoading, isAuthenticated }}>
        <div className='min-h-screen'>
          <SignupPage />
        </div>
      </MockAuthProvider>
    </MemoryRouter>
  )
}

const meta: Meta<typeof SignupPageStory> = {
  title: 'Pages/SignupPage',
  component: SignupPageStory,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Signup page with email/password registration, form validation, and password confirmation.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isDevelopmentMode: {
      control: 'boolean',
      description: 'Shows dev mode indicator when true',
    },
    isAuthLoading: {
      control: 'boolean',
      description: 'Shows loading state during authentication check',
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
    isAuthLoading: false,
    isAuthenticated: false,
  },
}

export const ProductionMode: Story = {
  args: {
    isDevelopmentMode: false,
    isAuthLoading: false,
    isAuthenticated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Signup page in production mode without the dev mode indicator.',
      },
    },
  },
}

export const Loading: Story = {
  args: {
    isDevelopmentMode: true,
    isAuthLoading: true,
    isAuthenticated: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Signup page in loading state during authentication check.',
      },
    },
  },
}

export const FormValidation: Story = {
  args: {
    isDevelopmentMode: true,
    isAuthLoading: false,
    isAuthenticated: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Try various form validation scenarios: empty fields, invalid email, password mismatch, short password.',
      },
    },
  },
}
