import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { LoginPage } from './LoginPage.js'

// Simple story wrapper - uses actual component with current environment
const LoginPageStory = ({ hasSuccessMessage = false }: { hasSuccessMessage?: boolean }) => {
  // Mock URL params for success message
  const searchParams = new URLSearchParams()
  if (hasSuccessMessage) {
    searchParams.set('message', 'Account created successfully. Please sign in.')
  }

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
