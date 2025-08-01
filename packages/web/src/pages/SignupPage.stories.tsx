import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { SignupPage } from './SignupPage.js'

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
const SignupPageStory = ({ isDevelopmentMode = true }: { isDevelopmentMode?: boolean }) => {
  React.useEffect(() => {
    mockEnv(isDevelopmentMode)
  }, [isDevelopmentMode])

  return (
    <MemoryRouter initialEntries={['/signup']}>
      <div className='min-h-screen'>
        <SignupPage />
      </div>
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
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isDevelopmentMode: true,
  },
}

export const ProductionMode: Story = {
  args: {
    isDevelopmentMode: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Signup page in production mode without the dev mode indicator.',
      },
    },
  },
}

export const FormValidation: Story = {
  args: {
    isDevelopmentMode: true,
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
