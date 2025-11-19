import { useEffect } from 'react'
import { useQuery, useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { getWorkerById$ } from '@work-squared/shared/queries'
import type { StaticRoomDefinition } from '@work-squared/shared/rooms'

const pendingWorkerCreations = new Map<string, Promise<void>>()
const FALLBACK_WORKER_ID = '__room_chat_no_worker__'

const generateStatus = (status?: 'active' | 'inactive' | 'archived') => status ?? 'active'

export const useRoomAgent = (room?: StaticRoomDefinition | null) => {
  const { store } = useStore()
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
          status: generateStatus(),
        })
      )
    )

    pendingWorkerCreations.set(workerId, creationPromise)

    creationPromise.finally(() => {
      pendingWorkerCreations.delete(workerId)
    })
  }, [room, worker, workerQueryReady, store, workerId])

  return {
    worker,
    isProvisioning: Boolean(room) && !worker,
  }
}
