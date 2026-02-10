import React, { useMemo } from 'react'
import { useQuery } from '../../livestore-compat.js'
import { getProjects$ } from '@lifebuild/shared/queries'
import { useTableState } from '../../hooks/useTableState.js'
import { TableSlot } from './TableSlot.js'

/**
 * TableBar component - The persistent bottom bar showing The Table (Gold, Silver, Bronze streams).
 * This shows the top priority projects across the three work streams.
 */
export const TableBar: React.FC = () => {
  const allProjects = useQuery(getProjects$) ?? []
  const { configuration, tabledBronzeProjects } = useTableState()

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

  return (
    <div className='bg-white/95 border-t border-[#e8e4de] shadow-[0_-12px_24px_rgba(0,0,0,0.06)] py-3 pr-6 pl-3 flex-shrink-0 flex items-center gap-1'>
      <div className='text-[11px] font-semibold text-[#8b8680] uppercase tracking-wider [writing-mode:vertical-lr] rotate-180 flex-shrink-0'>
        The Table
      </div>
      <div className='grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3 items-center flex-1'>
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
          projectId={topBronzeProject?.id}
          projectName={topBronzeProject?.name}
          projectMeta={topBronzeProject?.category ?? undefined}
          bronzeCount={validTabledBronzeCount > 1 ? validTabledBronzeCount - 1 : undefined}
        />
      </div>
    </div>
  )
}
