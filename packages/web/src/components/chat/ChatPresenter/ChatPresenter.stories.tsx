import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { ChatPresenter } from './ChatPresenter.js'
import {
  getConversations$,
  getWorkerById$,
  getConversationMessages$,
} from '@work-squared/shared/queries'
import { schema, events, type Worker } from '@work-squared/shared/schema'
import { LiveStoreProvider, useQuery } from '@livestore/react'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'

type ChatPresenterProps = React.ComponentProps<typeof ChatPresenter>

// Props that the helper provides via LiveStore queries
type ProvidedProps = 'conversations' | 'currentWorker' | 'selectedConversation' | 'messages'

// Props that stories need to provide
type ChatPresenterHelperProps = Omit<ChatPresenterProps, ProvidedProps> & {
  currentWorkerId?: string
}

const ChatPresenterHelper = (props: ChatPresenterHelperProps) => {
  const conversations = useQuery(getConversations$)
  const selectedConversation =
    conversations.find(c => c.id === props.selectedConversationId) || null

  // Always call hooks unconditionally (Rules of Hooks) - query with empty IDs returns empty arrays
  const allWorkers = useQuery(getWorkerById$(props.currentWorkerId || ''))
  const currentWorker = props.currentWorkerId ? allWorkers?.[0] || null : null

  // Get messages for the selected conversation
  const allMessages = useQuery(getConversationMessages$(props.selectedConversationId || ''))
  const messages = props.selectedConversationId ? allMessages : []

  return (
    <ChatPresenter
      {...props}
      conversations={conversations}
      currentWorker={currentWorker}
      selectedConversation={selectedConversation}
      messages={messages}
    />
  )
}

// Helper to wrap stories with LiveStore - creates fresh adapter for each story
const withLiveStore = (boot: (store: Store) => void) => (Story: React.ComponentType) => (
  <LiveStoreProvider
    schema={schema}
    adapter={makeInMemoryAdapter()}
    batchUpdates={batchUpdates}
    boot={boot}
  >
    <Story />
  </LiveStoreProvider>
)

const storySetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: '1',
      name: 'New Assistant',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )

  store.commit(
    events.conversationCreated({
      id: '1',
      title: 'Conversation with New Assistant',
      createdAt: new Date(),
      model: 'claude-sonnet-4-20250514',
      workerId: '1',
    })
  )
}

const meta = {
  title: 'Components/Chat/ChatPresenter',
  component: ChatPresenterHelper,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Presentational chat interface component. Displays conversations, messages, and handles user interactions.',
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
} satisfies Meta<typeof ChatPresenterHelper>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    availableWorkers: [],
    selectedConversationId: null,
    processingConversations: new Set(),
    messageText: '',
    showChatPicker: false,
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  },
}

const withConversationsSetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: '1',
      name: 'Sample Assistant',
      avatar: '✨',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: '1',
      title: 'Conversation with Sample Assistant',
      model: 'claude-sonnet-4-20250514',
      createdAt: new Date(),
      workerId: '1',
    })
  )
}

export const WithConversations: Story = {
  args: {
    availableWorkers: [],
    selectedConversationId: null,
    processingConversations: new Set(),
    messageText: '',
    showChatPicker: false,
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  },
  decorators: [withLiveStore(withConversationsSetup)],
}

export const WithSelectedConversation: Story = {
  args: {
    availableWorkers: [],
    selectedConversationId: '1',
    currentWorkerId: '1',
    processingConversations: new Set(),
    messageText: '',
    showChatPicker: false,
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  },
  decorators: [withLiveStore(withConversationsSetup)],
}

const processingSetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: '1',
      name: 'Processing Assistant',
      avatar: '⚡',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: '1',
      title: 'Processing Conversation',
      model: 'claude-sonnet-4-20250514',
      createdAt: new Date(),
      workerId: '1',
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg-1',
      conversationId: '1',
      message: 'Hello! How can I help you?',
      role: 'assistant',
      createdAt: new Date(),
    })
  )
}

export const Processing: Story = {
  args: {
    availableWorkers: [],
    selectedConversationId: '1',
    currentWorkerId: '1',
    processingConversations: new Set(['1']),
    messageText: '',
    showChatPicker: false,
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  },
  decorators: [withLiveStore(processingSetup)],
}

export const WithMessageDraft: Story = {
  args: {
    availableWorkers: [],
    selectedConversationId: '1',
    currentWorkerId: '1',
    messageText: 'This is a draft message that the user is typing...',
    processingConversations: new Set(),
    showChatPicker: false,
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  },
  decorators: [withLiveStore(withConversationsSetup)],
}

const chatPickerSetup = (store: Store) => {
  // Create multiple workers for the picker
  store.commit(
    events.workerCreated({
      id: '1',
      name: 'Assistant',
      avatar: '🤖',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.workerCreated({
      id: '2',
      name: 'Code Reviewer',
      avatar: '👨‍💻',
      roleDescription: 'Specialized in code reviews',
      createdAt: new Date(),
      systemPrompt: 'You are a code review specialist.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.workerCreated({
      id: '3',
      name: 'Project Manager',
      avatar: '📋',
      roleDescription: 'Project planning and management',
      createdAt: new Date(),
      systemPrompt: 'You are a project management expert.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: '1',
      title: 'Sample Conversation',
      model: 'claude-sonnet-4-20250514',
      createdAt: new Date(),
      workerId: '1',
    })
  )
}

export const ChatPickerOpen: Story = {
  args: {
    availableWorkers: [],
    selectedConversationId: null,
    currentWorkerId: '1',
    showChatPicker: true,
    processingConversations: new Set(),
    messageText: '',
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  },
  decorators: [withLiveStore(chatPickerSetup)],
}

const longConversationSetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: '1',
      name: 'Chatty Assistant',
      avatar: '💬',
      createdAt: new Date(),
      systemPrompt: 'You are a helpful assistant.',
      defaultModel: 'claude-sonnet-4-20250514',
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: '1',
      title: 'Long Conversation',
      model: 'claude-sonnet-4-20250514',
      createdAt: new Date(),
      workerId: '1',
    })
  )

  // Create a long conversation with many messages
  for (let i = 0; i < 20; i++) {
    const isUser = i % 2 === 0
    store.commit(
      events.chatMessageSent({
        id: `msg-${i}`,
        conversationId: '1',
        message: isUser
          ? `User message ${i}: This is a longer message to demonstrate scrolling behavior in the message list.`
          : `Assistant response ${i}: This is a detailed response with multiple paragraphs.\n\nIt includes line breaks and formatting to show how the component handles longer content.`,
        role: isUser ? 'user' : 'assistant',
        createdAt: new Date(Date.now() + i * 60000),
      })
    )
  }
}

export const LongConversation: Story = {
  args: {
    availableWorkers: [],
    selectedConversationId: '1',
    currentWorkerId: '1',
    processingConversations: new Set(),
    messageText: '',
    showChatPicker: false,
    onConversationChange: () => {},
    onSendMessage: () => {},
    onMessageTextChange: () => {},
    onShowChatPicker: () => {},
    onHideChatPicker: () => {},
    onChatTypeSelect: () => {},
  },
  decorators: [withLiveStore(longConversationSetup)],
}
