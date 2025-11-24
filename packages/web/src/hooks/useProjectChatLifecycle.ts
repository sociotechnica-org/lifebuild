import React from 'react'
import { useQuery, useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getConversationByRoom$, getWorkerById$ } from '@work-squared/shared/queries'
import type { Project } from '@work-squared/shared/schema'
import type { StaticRoomDefinition } from '@work-squared/shared/rooms'

const FALLBACK_ROOM_ID = '__project_room_missing__'
const FALLBACK_WORKER_ID = '__project_worker_missing__'

const ensureDate = (value?: Date | number | null) => {
  if (!value) return null
  return value instanceof Date ? value : new Date(value)
}

export const useProjectChatLifecycle = (
  project: Project | null,
  room: StaticRoomDefinition | null
) => {
  const { store } = useStore()

  const workerQuery = React.useMemo(
    () => getWorkerById$(room?.worker.id ?? FALLBACK_WORKER_ID),
    [room?.worker.id]
  )
  const workerResult = useQuery(workerQuery)
  const worker = room ? (workerResult?.[0] ?? null) : null

  const conversationQuery = React.useMemo(
    () => getConversationByRoom$(room?.roomId ?? FALLBACK_ROOM_ID),
    [room?.roomId]
  )
  const conversationResult = useQuery(conversationQuery)
  const conversation = room ? (conversationResult?.[0] ?? null) : null

  React.useEffect(() => {
    if (!project || !room) return

    const archivedAt = ensureDate(project.deletedAt ?? project.archivedAt)
    const isArchived = Boolean(archivedAt)

    if (isArchived) {
      const targetStatus = project.deletedAt ? 'archived' : 'inactive'
      if (worker && worker.status !== targetStatus) {
        store.commit(
          events.workerUpdatedV2({
            id: worker.id,
            updates: {
              status: targetStatus as 'inactive' | 'archived',
              isActive: false,
            },
            updatedAt: archivedAt ?? new Date(),
          })
        )
      }

      if (conversation && !conversation.archivedAt) {
        store.commit(
          events.conversationArchived({
            conversationId: conversation.id,
            archivedAt: archivedAt ?? new Date(),
            actorId: undefined,
          })
        )
      }
      return
    }

    if (worker && worker.status !== 'active') {
      store.commit(
        events.workerUpdatedV2({
          id: worker.id,
          updates: { status: 'active', isActive: true },
          updatedAt: new Date(),
        })
      )
    }

    if (conversation?.archivedAt) {
      store.commit(
        events.conversationUnarchived({
          conversationId: conversation.id,
          unarchivedAt: new Date(),
          actorId: undefined,
        })
      )
    }
  }, [conversation, project, room, store, worker])
}
