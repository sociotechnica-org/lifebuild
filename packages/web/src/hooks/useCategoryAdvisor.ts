import { useEffect, useRef, useMemo } from 'react'
import { useStore, useQuery } from '../livestore-compat.js'
import { events } from '@lifebuild/shared/schema'
import { getWorkerById$, getConversations$ } from '@lifebuild/shared/queries'
import {
  type ProjectCategory,
  DEFAULT_MODEL,
  getCategoryAdvisorPrompt,
  getCategoryAdvisorName,
  getCategoryAdvisorRole,
} from '@lifebuild/shared'
import { useAuth } from '../contexts/AuthContext.js'

const pendingAdvisorCreation = new Map<string, Promise<void>>()

const isUniqueConstraintError = (error: unknown, constraint: string): boolean => {
  if (!error) return false
  const message =
    (error instanceof Error && error.message) ||
    (typeof error === 'object' && 'toString' in error ? String(error) : '')
  return typeof message === 'string' && message.includes(constraint)
}

/**
 * Hook to ensure a category advisor exists and get its ID
 *
 * Auto-creates the advisor if it doesn't exist when first called
 */
export function useCategoryAdvisor(category: ProjectCategory | null | undefined) {
  const { store } = useStore()
  const { user } = useAuth()
  const creationAttempted = useRef(false)
  const isMountedRef = useRef(true)

  // Get the advisor ID based on naming convention
  const advisorId = category ? `${category}-advisor` : null

  // Query for the advisor worker
  const advisorQuery = useMemo(() => getWorkerById$(advisorId ?? '__no_advisor__'), [advisorId])
  const advisorResult = useQuery(advisorQuery)
  const advisor = advisorId && advisorResult?.[0] ? advisorResult[0] : null

  // For now, we'll check if advisor exists to determine readiness
  // In future, could add query for workerCategories table if needed
  const advisorCategoryAssignment = advisor // Simplified - we trust the naming convention

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Auto-create advisor if it doesn't exist
  useEffect(() => {
    if (!category || !advisorId || !user || !store) return
    if (creationAttempted.current) return
    if (advisor || advisorCategoryAssignment) return

    creationAttempted.current = true

    const createAdvisor = async () => {
      if (!isMountedRef.current) return

      const existingPromise = pendingAdvisorCreation.get(advisorId)
      if (existingPromise) {
        await existingPromise
        return
      }

      const creationPromise = (async () => {
        const now = new Date()

        try {
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

          if (!isMountedRef.current) return

          await store.commit(
            events.workerAssignedToCategory({
              workerId: advisorId,
              category: category as any,
              assignedAt: now,
              actorId: user.id,
            })
          )
        } catch (error) {
          if (isUniqueConstraintError(error, 'UNIQUE constraint failed: workers.id')) {
            // Advisor already exists, so it's safe to proceed.
            return
          }

          if (isMountedRef.current) {
            console.error(`Failed to create category advisor for ${category}:`, error)
            creationAttempted.current = false
          }
        } finally {
          pendingAdvisorCreation.delete(advisorId)
        }
      })()

      pendingAdvisorCreation.set(advisorId, creationPromise)
      await creationPromise
    }

    createAdvisor()
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
  const isMountedRef = useRef(true)

  // Query for existing conversation with this advisor
  const allConversations = useQuery(getConversations$) ?? []
  const conversation = allConversations.find(c => c.workerId === advisorId) || null

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Auto-create conversation if advisor exists but no conversation
  useEffect(() => {
    if (!category || !advisorId || !user || !isReady || !store) return
    if (conversationCreationAttempted.current) return
    if (conversation) return

    conversationCreationAttempted.current = true

    const createConversation = async () => {
      // Check component is still mounted
      if (!isMountedRef.current) return

      const conversationId = crypto.randomUUID()
      const now = new Date()

      try {
        await store.commit(
          events.conversationCreated({
            id: conversationId,
            title: `${getCategoryAdvisorName(category)} Planning`,
            model: advisor?.defaultModel || DEFAULT_MODEL,
            workerId: advisorId,
            createdAt: now,
          })
        )
      } catch (error) {
        // Only log error if component is still mounted
        if (isMountedRef.current) {
          console.error(`Failed to create conversation with ${category} advisor:`, error)
          conversationCreationAttempted.current = false // Allow retry on error
        }
      }
    }

    createConversation()
  }, [category, advisorId, advisor, isReady, conversation, store, user])

  return {
    conversationId: conversation?.id,
    conversation,
    advisorId,
    advisor,
    isReady: isReady && !!conversation,
  }
}
