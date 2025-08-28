import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChatPresenter } from './ChatPresenter.js'

const meta: Meta<typeof ChatPresenter> = {
  title: 'Components/Chat/ChatPresenter',
  component: ChatPresenter,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main chat interface component with conversation selection and messaging. Uses useChatData hook internally to manage state.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ height: '600px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// Note: ChatPresenter now uses useChatData internally, so it will use real data from LiveStore
// These stories will show the actual state from the application
export const Default: Story = {}
