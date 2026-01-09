import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { MessageList } from './MessageList.js'
import { getConversationMessages$, getWorkerById$ } from '@lifebuild/shared/queries'
import { schema, events } from '@lifebuild/shared/schema'
import { DEFAULT_MODEL_STRING } from '@lifebuild/shared'
import { LiveStoreProvider, useQuery } from '../../../livestore-compat.js'
import { makeInMemoryAdapter } from '@livestore/adapter-web'
import { unstable_batchedUpdates as batchUpdates } from 'react-dom'
import { Store } from '@livestore/livestore'

type MessageListProps = React.ComponentProps<typeof MessageList>

// Props that the helper provides via LiveStore queries
type ProvidedProps = 'messages' | 'currentWorker'

// Props that stories need to provide
type MessageListHelperProps = Omit<MessageListProps, ProvidedProps> & {
  conversationId?: string
  workerId?: string
}

const MessageListHelper = (props: MessageListHelperProps) => {
  // Always call hooks unconditionally (Rules of Hooks) - query with empty IDs returns empty arrays
  const allMessages = useQuery(getConversationMessages$(props.conversationId || ''))
  const messages = props.conversationId ? allMessages : []

  const allWorkers = useQuery(getWorkerById$(props.workerId || ''))
  const worker = props.workerId ? allWorkers?.[0] || null : null

  return <MessageList {...props} messages={messages} currentWorker={worker} />
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

const meta = {
  title: 'Components/Chat/MessageList',
  component: MessageListHelper,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a list of chat messages with different types and states',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div style={{ height: '400px', width: '600px', border: '1px solid #ccc' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MessageListHelper>

export default meta
type Story = StoryObj<typeof meta>

const basicMessagesSetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: 'worker-1',
      name: 'Diligent Aide',
      avatar: '☀️',
      roleDescription: 'Project Manager',
      systemPrompt: 'You are a helpful project management assistant.',
      defaultModel: DEFAULT_MODEL_STRING,
      createdAt: new Date('2024-01-01'),
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: 'conv1',
      title: 'Test Conversation',
      model: DEFAULT_MODEL_STRING,
      createdAt: new Date('2025-01-01T12:00:00'),
      workerId: 'worker-1',
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg1',
      conversationId: 'conv1',
      message: 'Hello! Can you help me create some tasks?',
      role: 'user',
      createdAt: new Date('2025-01-01T12:00:00'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg2',
      conversationId: 'conv1',
      message:
        "Of course! I'd be happy to help you create tasks. What tasks would you like to create?",
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:00:10'),
    })
  )
}

export const Default: Story = {
  args: {
    conversationId: 'conv1',
    workerId: 'worker-1',
    isProcessing: false,
    conversationTitle: 'Test Conversation',
  },
  decorators: [withLiveStore(basicMessagesSetup)],
}

const toolCallMessagesSetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: 'worker-1',
      name: 'Diligent Aide',
      avatar: '☀️',
      roleDescription: 'Project Manager',
      systemPrompt: 'You are a helpful project management assistant.',
      defaultModel: DEFAULT_MODEL_STRING,
      createdAt: new Date('2024-01-01'),
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: 'conv1',
      title: 'Tool Call Example',
      model: DEFAULT_MODEL_STRING,
      createdAt: new Date('2025-01-01T12:00:00'),
      workerId: 'worker-1',
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg1',
      conversationId: 'conv1',
      message: 'Create a task called "Review PR"',
      role: 'user',
      createdAt: new Date('2025-01-01T12:00:00'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg2',
      conversationId: 'conv1',
      message: 'Using create_task tool...',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:00:10'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg3',
      conversationId: 'conv1',
      message:
        'Task created successfully: "Review PR" on board "Main Board" in column "Todo". Task ID: 123e4567-e89b-12d3-a456-426614174000',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:00:15'),
    })
  )
}

export const WithToolCalls: Story = {
  args: {
    conversationId: 'conv1',
    workerId: 'worker-1',
    isProcessing: false,
    conversationTitle: 'Tool Call Example',
  },
  decorators: [withLiveStore(toolCallMessagesSetup)],
}

const processingSetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: 'worker-1',
      name: 'Diligent Aide',
      avatar: '☀️',
      roleDescription: 'Project Manager',
      systemPrompt: 'You are a helpful project management assistant.',
      defaultModel: DEFAULT_MODEL_STRING,
      createdAt: new Date('2024-01-01'),
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: 'conv1',
      title: 'Processing...',
      model: DEFAULT_MODEL_STRING,
      createdAt: new Date('2025-01-01T12:00:00'),
      workerId: 'worker-1',
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg1',
      conversationId: 'conv1',
      message: 'Hello! Can you help me create some tasks?',
      role: 'user',
      createdAt: new Date('2025-01-01T12:00:00'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg2',
      conversationId: 'conv1',
      message:
        "Of course! I'd be happy to help you create tasks. What tasks would you like to create?",
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:00:10'),
    })
  )
}

export const Processing: Story = {
  args: {
    conversationId: 'conv1',
    workerId: 'worker-1',
    isProcessing: true,
    conversationTitle: 'Processing...',
  },
  decorators: [withLiveStore(processingSetup)],
}

const emptySetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: 'worker-1',
      name: 'Diligent Aide',
      avatar: '☀️',
      roleDescription: 'Project Manager',
      systemPrompt: 'You are a helpful project management assistant.',
      defaultModel: DEFAULT_MODEL_STRING,
      createdAt: new Date('2024-01-01'),
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: 'conv1',
      title: 'New Conversation',
      model: DEFAULT_MODEL_STRING,
      createdAt: new Date('2025-01-01T12:00:00'),
      workerId: 'worker-1',
    })
  )
}

export const Empty: Story = {
  args: {
    conversationId: 'conv1',
    workerId: 'worker-1',
    isProcessing: false,
    conversationTitle: 'New Conversation',
  },
  decorators: [withLiveStore(emptySetup)],
}

const longConversationSetup = (store: Store) => {
  store.commit(
    events.workerCreated({
      id: 'worker-1',
      name: 'Diligent Aide',
      avatar: '☀️',
      roleDescription: 'Project Manager',
      systemPrompt: 'You are a helpful project management assistant.',
      defaultModel: DEFAULT_MODEL_STRING,
      createdAt: new Date('2024-01-01'),
      actorId: '1',
    })
  )
  store.commit(
    events.conversationCreated({
      id: 'conv1',
      title: 'Long Conversation',
      model: DEFAULT_MODEL_STRING,
      createdAt: new Date('2025-01-01T12:00:00'),
      workerId: 'worker-1',
    })
  )

  // Create initial messages
  store.commit(
    events.chatMessageSent({
      id: 'msg1',
      conversationId: 'conv1',
      message: 'Hello! Can you help me create some tasks?',
      role: 'user',
      createdAt: new Date('2025-01-01T12:00:00'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg2',
      conversationId: 'conv1',
      message:
        "Of course! I'd be happy to help you create tasks. What tasks would you like to create?",
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:00:10'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg3',
      conversationId: 'conv1',
      message: 'Create a task called "Review PR"',
      role: 'user',
      createdAt: new Date('2025-01-01T12:01:00'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg4',
      conversationId: 'conv1',
      message: "I'll create that documentation task for you right away.",
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:01:10'),
    })
  )

  // Add tool call messages
  store.commit(
    events.chatMessageSent({
      id: 'msg5',
      conversationId: 'conv1',
      message: 'Using create_task tool...',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:01:15'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg6',
      conversationId: 'conv1',
      message:
        'Task created successfully: "Review PR" on board "Main Board" in column "Todo". Task ID: 123e4567-e89b-12d3-a456-426614174000',
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:01:20'),
    })
  )

  // Add more messages to create a long conversation
  store.commit(
    events.chatMessageSent({
      id: 'msg7',
      conversationId: 'conv1',
      message: 'Great! Now create another task called "Write documentation"',
      role: 'user',
      createdAt: new Date('2025-01-01T12:02:00'),
    })
  )
  store.commit(
    events.chatMessageSent({
      id: 'msg8',
      conversationId: 'conv1',
      message: "I'll create that documentation task for you right away.",
      role: 'assistant',
      createdAt: new Date('2025-01-01T12:02:10'),
    })
  )
}

export const LongConversation: Story = {
  args: {
    conversationId: 'conv1',
    workerId: 'worker-1',
    isProcessing: false,
    conversationTitle: 'Long Conversation',
  },
  decorators: [withLiveStore(longConversationSetup)],
}
