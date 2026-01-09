import { useEffect } from 'react'
import { useQuery, useStore } from '../livestore-compat.js'
import { events } from '@lifebuild/shared/schema'
import { getWorkerById$ } from '@lifebuild/shared/queries'
import type { StaticRoomDefinition } from '@lifebuild/shared/rooms'
import { usePostHog } from '../lib/analytics.js'

const pendingWorkerCreations = new Map<string, Promise<void>>()
const FALLBACK_WORKER_ID = '__room_chat_no_worker__'

const generateStatus = (status?: 'active' | 'inactive' | 'archived') => status ?? 'active'

export const useRoomAgent = (room?: StaticRoomDefinition | null) => {
  const { store } = useStore()
  const posthog = usePostHog()
  const workerId = room?.worker.id ?? FALLBACK_WORKER_ID

  const workerQuery = getWorkerById$(workerId)
  const workerResult = useQuery(workerQuery)
  const workerQueryReady = workerResult !== undefined
  const worker = workerId === FALLBACK_WORKER_ID ? null : (workerResult?.[0] ?? null)

  useEffect(() => {
    if (!room || workerId === FALLBACK_WORKER_ID) return
    if (!workerQueryReady) return
    if (worker) return
    if (pendingWorkerCreations.has(workerId)) return

    const creationPromise = Promise.resolve(
      store.commit(
        events.workerCreatedV2({
          id: room.worker.id,
          name: room.worker.name,
          roleDescription: room.worker.roleDescription,
          systemPrompt: room.worker.prompt,
          avatar: room.worker.avatar,
          defaultModel: room.worker.defaultModel,
          createdAt: new Date(),
          roomId: room.roomId,
          roomKind: room.roomKind,
          status: generateStatus(room.worker.status),
        })
      )
    )

    pendingWorkerCreations.set(workerId, creationPromise)

    creationPromise
      .then(() => {
        posthog?.capture('room_chat_worker_created', {
          workerId: room.worker.id,
          roomId: room.roomId,
          roomKind: room.roomKind,
        })
      })
      .finally(() => {
        pendingWorkerCreations.delete(workerId)
      })
  }, [room, worker, workerQueryReady, store, workerId, posthog])

  useEffect(() => {
    if (!room || !worker) return

    const updates: Record<string, any> = {}
    const normalizedRoleDescription = room.worker.roleDescription ?? null
    const normalizedAvatar = room.worker.avatar ?? null

    if (worker.name !== room.worker.name) updates.name = room.worker.name
    if ((worker.roleDescription ?? null) !== normalizedRoleDescription)
      updates.roleDescription = normalizedRoleDescription
    if (worker.systemPrompt !== room.worker.prompt) updates.systemPrompt = room.worker.prompt
    if ((worker.avatar ?? null) !== normalizedAvatar) updates.avatar = normalizedAvatar
    if (worker.defaultModel !== room.worker.defaultModel)
      updates.defaultModel = room.worker.defaultModel
    if (worker.roomId !== room.roomId) updates.roomId = room.roomId
    if (worker.roomKind !== room.roomKind) updates.roomKind = room.roomKind
    if (room.worker.status && worker.status && worker.status !== room.worker.status) {
      updates.status = room.worker.status
      updates.isActive = room.worker.status === 'active'
    }

    if (Object.keys(updates).length === 0) return

    store.commit(
      events.workerUpdatedV2({
        id: worker.id,
        updates,
        updatedAt: new Date(),
      })
    )
  }, [room, store, worker])

  return {
    worker,
    isProvisioning: Boolean(room) && !worker,
  }
}
