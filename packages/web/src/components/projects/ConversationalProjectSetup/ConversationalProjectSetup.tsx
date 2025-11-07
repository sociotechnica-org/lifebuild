import React from 'react'
import { useStore } from '@livestore/react'
import { useLocation, useNavigate } from 'react-router-dom'
import { events } from '@work-squared/shared/schema'
import type { Project } from '@work-squared/shared/schema'
import { ChatInterface } from '../../chat/ChatInterface/ChatInterface.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import { useAuth } from '../../../contexts/AuthContext.js'
import { DEFAULT_MODEL } from '../../../utils/models.js'

interface ConversationalProjectSetupProps {
  project: Project
}

/**
 * Conversational Project Setup Component
 *
 * This component provides a guided conversational experience for setting up a new project.
 * It creates a project-scoped conversation and prompts the user to describe their project.
 * The AI assistant (Jarvis) helps extract project metadata and create initial structure.
 */
export const ConversationalProjectSetup: React.FC<ConversationalProjectSetupProps> = ({
  project,
}) => {
  const { store } = useStore()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [conversationId, setConversationId] = React.useState<string | null>(null)

  // Create a project-scoped conversation on mount
  React.useEffect(() => {
    // Check if conversation already exists via URL param
    const params = new URLSearchParams(location.search)
    const existingConversationId = params.get('conversationId')

    if (existingConversationId) {
      setConversationId(existingConversationId)
      return
    }

    // Create new conversation scoped to this project
    const id = crypto.randomUUID()
    const title = `Setting up: ${project.name}`

    // Find Jarvis worker (main agent) - we'll assume there's a worker with id 'jarvis' or similar
    // For now, we'll create a conversation without a specific worker
    store.commit(
      events.conversationCreatedV2({
        id,
        title,
        model: DEFAULT_MODEL,
        workerId: undefined, // Could be set to Jarvis worker ID
        projectId: project.id, // Scope to this project
        createdAt: new Date(),
      })
    )

    // Send initial system message to guide the conversation
    const welcomeMessageId = crypto.randomUUID()
    store.commit(
      events.chatMessageSent({
        id: welcomeMessageId,
        conversationId: id,
        message: 'Tell me about your project. What are you trying to accomplish?',
        role: 'system',
        createdAt: new Date(),
      })
    )

    setConversationId(id)

    // Update URL with conversation ID
    const newParams = new URLSearchParams(location.search)
    newParams.set('conversationId', id)
    navigate(`${location.pathname}?${newParams.toString()}`, { replace: true })
  }, [project.id, project.name, store, location.search, location.pathname, navigate])

  const handleExitSetup = () => {
    // Remove conversational setup flag from project attributes
    const currentAttributes = (project.attributes as any) || {}
    const { conversationalSetup, ...remainingAttributes } = currentAttributes

    store.commit(
      events.projectAttributesUpdated({
        id: project.id,
        attributes: remainingAttributes,
        updatedAt: new Date(),
        actorId: user?.id,
      })
    )

    // Navigate to normal project view (remove setupMode param)
    const params = new URLSearchParams(location.search)
    params.delete('setupMode')
    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }

  return (
    <div className='h-full bg-white flex flex-col'>
      {/* Header */}
      <div className='border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4'>
        <div className='flex items-center justify-between mb-3'>
          <div>
            <h1 className='text-xl font-semibold text-gray-900 mb-1'>Let's set up your project</h1>
            <p className='text-gray-600 text-sm'>
              Tell me about your project and I'll help you get organized
            </p>
          </div>
          <button
            onClick={handleExitSetup}
            className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            Skip Setup
          </button>
        </div>

        {/* Progress Indicator */}
        <div className='bg-white rounded-lg p-3 border border-blue-200'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold'>
                1
              </div>
              <span className='text-sm font-medium text-blue-900'>Conversational Setup</span>
            </div>
            <div className='flex-1 flex gap-1'>
              <div className='h-2 flex-1 rounded-full bg-blue-600' />
              <div className='h-2 flex-1 rounded-full bg-gray-300' />
              <div className='h-2 flex-1 rounded-full bg-gray-300' />
            </div>
          </div>
          <p className='text-xs text-gray-600 mt-2 ml-10'>
            I'll help you define your project's name, goals, and initial tasks
          </p>
        </div>
      </div>

      {/* Chat Interface */}
      <div className='flex-1 overflow-hidden'>
        <ChatInterface projectId={project.id} />
      </div>

      {/* Footer with helpful tips */}
      <div className='border-t border-gray-200 bg-gray-50 px-6 py-3'>
        <div className='flex items-center gap-2 text-sm text-gray-600'>
          <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
              clipRule='evenodd'
            />
          </svg>
          <span>
            Tip: Describe what you want to accomplish, who's involved, and any deadlines. I'll
            organize everything for you.
          </span>
        </div>
      </div>
    </div>
  )
}
