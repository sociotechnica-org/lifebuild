import React, { useMemo } from 'react'
import { useQuery } from '@livestore/react'
import { getProjects$, getAllTasks$ } from '@work-squared/shared/queries'
import { useTableState } from '../../../hooks/useTableState.js'
import { TableSlot } from './TableSlot.js'

/**
 * TableBar component - The persistent bottom bar showing The Table (Gold, Silver, Bronze streams).
 * This shows the top priority projects across the three work streams.
 */
export const TableBar: React.FC = () => {
  const allProjects = useQuery(getProjects$) ?? []
  const allTasks = useQuery(getAllTasks$) ?? []
  const { configuration, activeBronzeStack } = useTableState()

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

  // Get top Bronze task details
  const topBronzeTask = useMemo(() => {
    if (activeBronzeStack.length === 0) return null
    const topEntry = activeBronzeStack[0]
    return allTasks.find(t => t.id === topEntry?.taskId) ?? null
  }, [activeBronzeStack, allTasks])

  // Get project name for bronze task
  const bronzeTaskProject = useMemo(() => {
    if (!topBronzeTask?.projectId) return null
    return allProjects.find(p => p.id === topBronzeTask.projectId) ?? null
  }, [topBronzeTask, allProjects])

  return (
    <div className='new-ui-table-bar'>
      <div className='new-ui-table-grid'>
        <TableSlot
          stream='gold'
          projectId={goldProject?.id}
          projectName={goldProject?.name}
          projectMeta={goldProject?.category ?? undefined}
        />
        <TableSlot
          stream='silver'
          projectId={silverProject?.id}
          projectName={silverProject?.name}
          projectMeta={silverProject?.category ?? undefined}
        />
        <TableSlot
          stream='bronze'
          projectId={topBronzeTask?.id}
          projectName={topBronzeTask?.title}
          projectMeta={bronzeTaskProject?.name ?? undefined}
          bronzeCount={activeBronzeStack.length > 1 ? activeBronzeStack.length - 1 : undefined}
        />
      </div>
    </div>
  )
}
