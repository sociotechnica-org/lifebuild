import { makeInMemoryAdapter } from '@livestore/adapter-web'
import type { Meta, StoryObj } from '@storybook/react'
import { events, schema } from '@lifebuild/shared/schema'
import { CAMPFIRE_ROOM } from '@lifebuild/shared/rooms'
import React from 'react'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { MemoryRouter } from 'react-router-dom'
import { LiveStoreProvider } from '../../livestore-compat.js'
import { CampfireConversation } from './CampfireConversation.js'
import { CAMPFIRE_BOOTSTRAP_MESSAGE } from '../room-chat/internalMessages.js'

const withProviders = (Story: React.ComponentType): React.ReactElement => {
  return (
    <LiveStoreProvider
      schema={schema}
      adapter={makeInMemoryAdapter()}
      batchUpdates={batchUpdates}
      boot={store => {
        const now = new Date('2026-02-27T12:00:00.000Z')
        const conversationId = 'storybook-campfire-conversation'

        store.commit(
          events.workerCreatedV2({
            id: CAMPFIRE_ROOM.worker.id,
            name: CAMPFIRE_ROOM.worker.name,
            roleDescription: CAMPFIRE_ROOM.worker.roleDescription,
            systemPrompt: CAMPFIRE_ROOM.worker.prompt,
            defaultModel: CAMPFIRE_ROOM.worker.defaultModel,
            roomId: CAMPFIRE_ROOM.roomId,
            roomKind: CAMPFIRE_ROOM.roomKind,
            status: 'active',
            createdAt: now,
          })
        )

        store.commit(
          events.conversationCreatedV2({
            id: conversationId,
            title: CAMPFIRE_ROOM.conversationTitle,
            model: CAMPFIRE_ROOM.worker.defaultModel,
            workerId: CAMPFIRE_ROOM.worker.id,
            roomId: CAMPFIRE_ROOM.roomId,
            roomKind: CAMPFIRE_ROOM.roomKind,
            scope: CAMPFIRE_ROOM.scope,
            createdAt: now,
          })
        )

        store.commit(
          events.chatMessageSent({
            id: 'campfire-bootstrap',
            conversationId,
            message: CAMPFIRE_BOOTSTRAP_MESSAGE,
            role: 'system',
            createdAt: now,
          })
        )

        store.commit(
          events.chatMessageSent({
            id: 'campfire-assistant-greeting',
            conversationId,
            message: 'Welcome to the campfire. What feels heaviest right now?',
            role: 'assistant',
            createdAt: new Date(now.getTime() + 1_000),
          })
        )
      }}
    >
      <MemoryRouter initialEntries={['/life-map?storeId=storybook']}>
        <div className='relative h-dvh w-full bg-[#efe2cd]'>
          <Story />
        </div>
      </MemoryRouter>
    </LiveStoreProvider>
  )
}

const meta: Meta<typeof CampfireConversation> = {
  title: 'Onboarding/CampfireConversation',
  component: CampfireConversation,
  args: {
    onKeepExploring: () => {},
  },
  decorators: [withProviders],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
