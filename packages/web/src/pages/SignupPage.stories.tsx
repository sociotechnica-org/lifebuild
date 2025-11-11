import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { SignupPage } from './SignupPage.js'

// Simple story wrapper that uses the existing BrowserRouter from Storybook preview
const SignupPageStory = () => {
  return (
    <div className='min-h-screen'>
      <SignupPage />
    </div>
  )
}

const meta: Meta<typeof SignupPageStory> = {
  title: 'Components/Pages/SignupPage',
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
