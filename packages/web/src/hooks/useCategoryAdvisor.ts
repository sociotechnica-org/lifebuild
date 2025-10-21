import { useEffect, useRef } from 'react'
import { useStore, useQuery } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getWorkerById$, getConversations$ } from '@work-squared/shared/queries'
import {
  type ProjectCategory,
  DEFAULT_MODEL,
  getCategoryAdvisorPrompt,
  getCategoryAdvisorName,
  getCategoryAdvisorRole,
} from '@work-squared/shared'
import { useAuth } from '../contexts/AuthContext.js'

/**
 * Hook to ensure a category advisor exists and get its ID
 *
 * Auto-creates the advisor if it doesn't exist when first called
 */
export function useCategoryAdvisor(category: ProjectCategory | null | undefined) {
  const { store } = useStore()
  const { user } = useAuth()
  const creationAttempted = useRef(false)

  // Get the advisor ID based on naming convention
  const advisorId = category ? `${category}-advisor` : null

  // Query for the advisor worker
  const advisorResult = useQuery(
    advisorId ? getWorkerById$(advisorId) : getWorkerById$('__no_advisor__')
  )
  const advisor = advisorId && advisorResult?.[0] ? advisorResult[0] : null

  // For now, we'll check if advisor exists to determine readiness
  // In future, could add query for workerCategories table if needed
  const advisorCategoryAssignment = advisor // Simplified - we trust the naming convention

  // Auto-create advisor if it doesn't exist
  useEffect(() => {
    if (!category || !advisorId || !user) return
    if (creationAttempted.current) return
    if (advisor || advisorCategoryAssignment) return

    creationAttempted.current = true

    const createAdvisor = async () => {
      const now = new Date()

      // Create the worker
      await store.commit(
        events.workerCreated({
          id: advisorId,
          name: getCategoryAdvisorName(category),
          roleDescription: getCategoryAdvisorRole(category),
          systemPrompt: getCategoryAdvisorPrompt(category),
          avatar: undefined,
          defaultModel: DEFAULT_MODEL,
          createdAt: now,
          actorId: user.id,
        })
      )

      // Assign worker to category
      await store.commit(
        events.workerAssignedToCategory({
          workerId: advisorId,
          category: category as any, // Type assertion needed due to literal types
          assignedAt: now,
          actorId: user.id,
        })
      )
    }

    createAdvisor().catch(error => {
      console.error(`Failed to create category advisor for ${category}:`, error)
      creationAttempted.current = false // Allow retry on error
    })
  }, [category, advisorId, advisor, advisorCategoryAssignment, store, user])

  return {
    advisorId,
    advisor,
    isReady: !!advisor && !!advisorCategoryAssignment,
  }
}

/**
 * Hook to get or create a conversation with a category advisor
 *
 * Returns the conversation ID and creates one if it doesn't exist
 */
export function useCategoryAdvisorConversation(category: ProjectCategory | null | undefined) {
  const { store } = useStore()
  const { user } = useAuth()
  const { advisorId, advisor, isReady } = useCategoryAdvisor(category)
  const conversationCreationAttempted = useRef(false)

  // Query for existing conversation with this advisor
  const allConversations = useQuery(getConversations$) ?? []
  const conversation = allConversations.find(c => c.workerId === advisorId) || null

  // Auto-create conversation if advisor exists but no conversation
  useEffect(() => {
    if (!category || !advisorId || !user || !isReady) return
    if (conversationCreationAttempted.current) return
    if (conversation) return

    conversationCreationAttempted.current = true

    const createConversation = async () => {
      const conversationId = crypto.randomUUID()
      const now = new Date()

      await store.commit(
        events.conversationCreated({
          id: conversationId,
          title: `${getCategoryAdvisorName(category)} Planning`,
          model: advisor?.defaultModel || DEFAULT_MODEL,
          workerId: advisorId,
          createdAt: now,
        })
      )
    }

    createConversation().catch(error => {
      console.error(`Failed to create conversation with ${category} advisor:`, error)
      conversationCreationAttempted.current = false // Allow retry on error
    })
  }, [category, advisorId, advisor, isReady, conversation, store, user])

  return {
    conversationId: conversation?.id,
    conversation,
    advisorId,
    advisor,
    isReady: isReady && !!conversation,
  }
}
