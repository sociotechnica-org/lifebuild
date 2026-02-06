import React, { useMemo, useCallback } from 'react'
import { useQuery, useStore } from '../../../livestore-compat.js'
import { getProjects$ } from '@lifebuild/shared/queries'
import { resolveLifecycleState, type ProjectLifecycleState } from '@lifebuild/shared'
import type { Project } from '@lifebuild/shared/schema'
import { events } from '@lifebuild/shared/schema'
import { useTableState } from '../../../hooks/useTableState.js'
import { useAuth } from '../../../contexts/AuthContext.js'
import { TableSlot } from './TableSlot.js'

function getLifecycleState(project: Project): ProjectLifecycleState {
  return resolveLifecycleState(project.projectLifecycleState, null)
}

/**
 * TableBar component - The persistent bottom bar showing The Table (Gold, Silver, Bronze streams).
 * This shows the top priority projects across the three work streams.
 * Empty Gold/Silver slots are clickable to select from backlog.
 */
export const TableBar: React.FC = () => {
  const allProjects = useQuery(getProjects$) ?? []
  const { configuration, tabledBronzeProjects, initializeConfiguration, assignGold, assignSilver } =
    useTableState()
  const { store } = useStore()
  const { user } = useAuth()
  const actorId = user?.id

  // Get Gold project details
  const goldProject = useMemo(
    () => allProjects.find(p => p.id === configuration?.goldProjectId) ?? null,
    [allProjects, configuration?.goldProjectId]
  )

  // Get Silver project details
  const silverProject = useMemo(
    () => allProjects.find(p => p.id === configuration?.silverProjectId) ?? null,
    [allProjects, configuration?.silverProjectId]
  )

  // Get top Bronze project details (skip orphan entries)
  const topBronzeProject = useMemo(() => {
    for (const entry of tabledBronzeProjects) {
      const project = allProjects.find(p => p.id === entry.projectId)
      if (project) return project
    }
    return null
  }, [tabledBronzeProjects, allProjects])

  const validTabledBronzeCount = useMemo(
    () =>
      tabledBronzeProjects.filter(entry => allProjects.some(p => p.id === entry.projectId)).length,
    [tabledBronzeProjects, allProjects]
  )

  // Filter backlog projects by stream (Stage 4, backlog status)
  const goldBacklog = useMemo(
    () =>
      allProjects
        .filter(p => {
          const lifecycle = getLifecycleState(p)
          return (
            lifecycle.status === 'backlog' &&
            lifecycle.stage === 4 &&
            lifecycle.stream === 'gold' &&
            p.id !== configuration?.goldProjectId
          )
        })
        .sort((a, b) => {
          const aPos = getLifecycleState(a).queuePosition ?? 999
          const bPos = getLifecycleState(b).queuePosition ?? 999
          return aPos - bPos
        }),
    [allProjects, configuration?.goldProjectId]
  )

  const silverBacklog = useMemo(
    () =>
      allProjects
        .filter(p => {
          const lifecycle = getLifecycleState(p)
          return (
            lifecycle.status === 'backlog' &&
            lifecycle.stage === 4 &&
            lifecycle.stream === 'silver' &&
            p.id !== configuration?.silverProjectId
          )
        })
        .sort((a, b) => {
          const aPos = getLifecycleState(a).queuePosition ?? 999
          const bPos = getLifecycleState(b).queuePosition ?? 999
          return aPos - bPos
        }),
    [allProjects, configuration?.silverProjectId]
  )

  // Handler for activating a gold project from backlog
  const handleActivateGold = useCallback(
    async (projectId: string) => {
      const project = allProjects.find(p => p.id === projectId)
      if (!project) return

      // Update project lifecycle to active with gold slot
      const currentLifecycle = getLifecycleState(project)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: project.id,
          lifecycleState: {
            ...currentLifecycle,
            status: 'active',
            slot: 'gold',
          },
          updatedAt: new Date(),
          actorId,
        })
      )

      // Initialize configuration if it doesn't exist, otherwise assign
      if (!configuration) {
        await initializeConfiguration({ goldProjectId: project.id })
      } else {
        await assignGold(project.id)
      }
    },
    [allProjects, store, actorId, configuration, initializeConfiguration, assignGold]
  )

  // Handler for activating a silver project from backlog
  const handleActivateSilver = useCallback(
    async (projectId: string) => {
      const project = allProjects.find(p => p.id === projectId)
      if (!project) return

      // Update project lifecycle to active with silver slot
      const currentLifecycle = getLifecycleState(project)
      store.commit(
        events.projectLifecycleUpdated({
          projectId: project.id,
          lifecycleState: {
            ...currentLifecycle,
            status: 'active',
            slot: 'silver',
          },
          updatedAt: new Date(),
          actorId,
        })
      )

      // Initialize configuration if it doesn't exist, otherwise assign
      if (!configuration) {
        await initializeConfiguration({ silverProjectId: project.id })
      } else {
        await assignSilver(project.id)
      }
    },
    [allProjects, store, actorId, configuration, initializeConfiguration, assignSilver]
  )

  return (
    <div className='bg-white/95 border-t border-[#e8e4de] shadow-[0_-12px_24px_rgba(0,0,0,0.06)] py-3.5 px-6 flex-shrink-0'>
      <div className='grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 items-center'>
        <TableSlot
          stream='gold'
          projectId={goldProject?.id}
          projectName={goldProject?.name}
          projectMeta={goldProject?.category ?? undefined}
          backlogItems={goldBacklog.map(p => ({
            id: p.id,
            name: p.name,
            meta: p.category ?? undefined,
          }))}
          onSelectFromBacklog={handleActivateGold}
        />
        <TableSlot
          stream='silver'
          projectId={silverProject?.id}
          projectName={silverProject?.name}
          projectMeta={silverProject?.category ?? undefined}
          backlogItems={silverBacklog.map(p => ({
            id: p.id,
            name: p.name,
            meta: p.category ?? undefined,
          }))}
          onSelectFromBacklog={handleActivateSilver}
        />
        <TableSlot
          stream='bronze'
          projectId={topBronzeProject?.id}
          projectName={topBronzeProject?.name}
          projectMeta={topBronzeProject?.category ?? undefined}
          bronzeCount={validTabledBronzeCount > 1 ? validTabledBronzeCount - 1 : undefined}
        />
      </div>
    </div>
  )
}
