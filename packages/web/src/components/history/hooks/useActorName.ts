import { useQuery } from '@livestore/react'
import { getUsers$, getWorkers$ } from '@work-squared/shared/queries'

export const useActorName = (actorId?: string): string | undefined => {
  const users = useQuery(getUsers$) ?? []
  const workers = useQuery(getWorkers$) ?? []

  if (!actorId) {
    return undefined
  }

  // Check users first
  const user = users.find(u => u.id === actorId)
  if (user) {
    return user.name
  }

  // Check workers
  const worker = workers.find(w => w.id === actorId)
  if (worker) {
    return `${worker.name} (Worker)`
  }

  // Fallback for unknown actors
  return 'Unknown user'
}
