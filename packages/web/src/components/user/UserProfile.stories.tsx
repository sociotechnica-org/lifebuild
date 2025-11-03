import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { UserProfile } from './UserProfile.js'
import { LiveStoreProvider } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'
import { schema, events } from '@work-squared/shared/schema'
import { AuthProvider } from '../../contexts/AuthContext.js'

const adapter = makeInMemoryAdapter()

const meta: Meta<typeof UserProfile> = {
  title: 'Components/UserProfile',
  component: UserProfile,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'User profile component showing authentication status, user avatar, and dropdown menu with settings and sign out options.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof UserProfile>

export default meta
type Story = StoryObj<typeof meta>

// Boot function creates a user in the store
const authenticatedUserSetup = (store: Store) => {
  store.commit(
    events.userCreated({
      id: 'user-1',
      name: 'John Doe',
      createdAt: new Date(),
      actorId: 'user-1',
      avatarUrl: undefined,
    })
  )
}

export const Authenticated: Story = {
  args: {},
  decorators: [
    Story => (
      <AuthProvider>
        <LiveStoreProvider
          schema={schema}
          adapter={adapter}
          batchUpdates={batchUpdates}
          boot={authenticatedUserSetup}
        >
          <div className='w-64'>
            <Story />
          </div>
        </LiveStoreProvider>
      </AuthProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'User profile when authenticated. Click the avatar to see the dropdown menu.',
      },
    },
  },
}

export const NotAuthenticated: Story = {
  args: {},
  decorators: [
    Story => (
      <AuthProvider>
        <LiveStoreProvider schema={schema} adapter={adapter} batchUpdates={batchUpdates}>
          <div className='w-64'>
            <Story />
          </div>
        </LiveStoreProvider>
      </AuthProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'User profile when not authenticated. Shows a "Sign in" button.',
      },
    },
  },
}

export const WithChatToggle: Story = {
  args: {
    isChatOpen: false,
    onChatToggle: () => console.log('Chat toggle clicked'),
  },
  decorators: [
    Story => (
      <AuthProvider>
        <LiveStoreProvider
          schema={schema}
          adapter={adapter}
          batchUpdates={batchUpdates}
          boot={authenticatedUserSetup}
        >
          <div className='w-64'>
            <Story />
          </div>
        </LiveStoreProvider>
      </AuthProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'User profile with chat toggle button enabled.',
      },
    },
  },
}

export const ChatOpen: Story = {
  args: {
    isChatOpen: true,
    onChatToggle: () => console.log('Chat toggle clicked'),
  },
  decorators: [
    Story => (
      <AuthProvider>
        <LiveStoreProvider
          schema={schema}
          adapter={adapter}
          batchUpdates={batchUpdates}
          boot={authenticatedUserSetup}
        >
          <div className='w-64'>
            <Story />
          </div>
        </LiveStoreProvider>
      </AuthProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'User profile with chat toggle button in the "open" state.',
      },
    },
  },
}
