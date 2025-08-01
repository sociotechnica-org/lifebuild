import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
import { SignupPage } from './SignupPage.js'

// Simple story wrapper - uses actual component with current environment
const SignupPageStory = () => {
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
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Default signup page with current environment settings.',
      },
    },
  },
}

export const FormValidation: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          'Try various form validation scenarios: empty fields, invalid email, password mismatch, short password.',
      },
    },
  },
}
