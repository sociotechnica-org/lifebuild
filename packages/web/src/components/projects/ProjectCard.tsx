import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '../../livestore-compat.js'
import { getProjectTasks$, getProjectWorkers$ } from '@lifebuild/shared/queries'
import type { Project as ProjectType } from '@lifebuild/shared/schema'
import {
  ARCHETYPE_LABELS,
  describeProjectLifecycleState,
  getCategoryInfo,
  resolveLifecycleState,
  type PlanningAttributes,
  type ProjectCategory,
  type ProjectLifecycleState,
} from '@lifebuild/shared'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { useAuth } from '../../contexts/AuthContext.js'
import { UrushiVisual, lifecycleToUrushiStage, type UrushiStage } from './UrushiVisual.js'
import { ProjectAvatar } from '../../common/ProjectAvatar.js'

const URUSHI_STAGE_LABELS: Record<UrushiStage, string> = {
  sketch: 'Sketch',
  foundation: 'Foundation',
  color: 'Color',
  polish: 'Polish',
  decoration: 'Decoration',
}

const parseAssigneeIds = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

const safeParseAttributes = (attributes: ProjectType['attributes']): PlanningAttributes | null => {
  if (!attributes) return null
  if (typeof attributes === 'object') return attributes as PlanningAttributes
  if (typeof attributes === 'string') {
    try {
      return JSON.parse(attributes) as PlanningAttributes
    } catch {
      return null
    }
  }
  return null
}

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '')
  const normalizedHex =
    normalized.length === 3
      ? normalized
          .split('')
          .map(char => char.repeat(2))
          .join('')
      : normalized
  const bigint = Number.parseInt(normalizedHex, 16)
  if (Number.isNaN(bigint)) return `rgba(14,165,233,${alpha})`
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const lifecycleBadgeLabel = (lifecycle: ProjectLifecycleState, stage: UrushiStage) => {
  if (lifecycle.status === 'backlog') {
    const stream = lifecycle.stream ?? 'bronze'
    return `${stream.charAt(0).toUpperCase()}${stream.slice(1)} plan`
  }
  if (lifecycle.status === 'active') {
    return lifecycle.slot ? `${lifecycle.slot.toUpperCase()} slot` : 'Active'
  }
  if (lifecycle.status === 'completed') return 'Completed'
  return URUSHI_STAGE_LABELS[stage]
}

interface ProjectCardProps {
  project: ProjectType
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { user: authUser } = useAuth()
  const tasks = useQuery(getProjectTasks$(project.id)) ?? []
  const workerProjects = useQuery(getProjectWorkers$(project.id)) ?? []

  const attributes = useMemo(() => safeParseAttributes(project.attributes), [project.attributes])

  const lifecycleState = useMemo(
    () => resolveLifecycleState(project.projectLifecycleState, attributes),
    [project.projectLifecycleState, attributes]
  )

  const { stage, progress } = useMemo(
    () => lifecycleToUrushiStage(lifecycleState),
    [lifecycleState]
  )
  const lifecycleLabel = describeProjectLifecycleState(lifecycleState)
  const archetypeLabel = lifecycleState.archetype
    ? ARCHETYPE_LABELS[lifecycleState.archetype]
    : null
  const categoryInfo = useMemo(
    () => getCategoryInfo(project.category as ProjectCategory),
    [project.category]
  )
  const accentColor = categoryInfo?.colorHex ?? '#0ea5e9'
  const progressPercent = Math.max(8, Math.min(100, Math.round(progress * 100)))

  const taskStats = useMemo(() => {
    const total = tasks.length
    const done = tasks.filter(task => task.status === 'done').length
    return { total, done }
  }, [tasks])

  const currentUserId = authUser?.id
  const userTaskCount = useMemo(() => {
    if (!currentUserId) return 0
    return tasks.filter(task => {
      const assigneeIds = parseAssigneeIds(task.assigneeIds)
      return assigneeIds.includes(currentUserId)
    }).length
  }, [tasks, currentUserId])

  const workerCount = useMemo(() => {
    const uniqueWorkerIds = new Set(workerProjects.map(wp => wp.workerId))
    return uniqueWorkerIds.size
  }, [workerProjects])

  const badgeLabel = lifecycleBadgeLabel(lifecycleState, stage)

  return (
    <Link
      to={preserveStoreIdInUrl(`/new/projects/${project.id}`)}
      className='block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg'
    >
      <div className='flex gap-4 p-4 sm:p-5'>
        <UrushiVisual
          lifecycle={lifecycleState}
          categoryColor={accentColor}
          className='hidden w-28 shrink-0 sm:block'
        />
        <div className='flex-1 space-y-3'>
          <div className='flex items-start justify-between gap-2'>
            <div className='space-y-1'>
              <div className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>
                {categoryInfo?.name ?? 'Uncategorized'}
              </div>
              <div className='flex items-center gap-3'>
                <ProjectAvatar project={project} size={40} />
                <h3 className='text-lg font-semibold leading-snug text-slate-900'>
                  {project.name || 'Untitled project'}
                </h3>
              </div>
              {project.description && (
                <p className='line-clamp-2 text-sm text-slate-600'>{project.description}</p>
              )}
            </div>
            <span
              className='inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700'
              style={{ color: accentColor, backgroundColor: hexToRgba(accentColor, 0.14) }}
            >
              {badgeLabel}
            </span>
          </div>

          <div className='flex flex-wrap items-center gap-2 text-xs text-slate-600'>
            <span className='rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700'>
              {lifecycleLabel}
            </span>
            {archetypeLabel && (
              <span className='rounded-full bg-slate-50 px-2 py-1 font-semibold text-slate-600'>
                {archetypeLabel}
              </span>
            )}
            {lifecycleState.status === 'backlog' &&
              lifecycleState.queuePosition != null && ( // Check for both null and undefined
                <span className='rounded-full bg-slate-50 px-2 py-1'>
                  Queue #{lifecycleState.queuePosition + 1}
                </span>
              )}
          </div>

          <div className='h-2 overflow-hidden rounded-full bg-slate-100'>
            <div
              className='h-full rounded-full'
              style={{
                width: `${progressPercent}%`,
                background: `linear-gradient(90deg, ${hexToRgba(accentColor, 0.4)}, ${accentColor})`,
              }}
            />
          </div>

          <div className='grid grid-cols-3 gap-3 text-xs'>
            <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-3'>
              <div className='font-semibold text-slate-700'>Tasks</div>
              <div className='text-sm text-slate-900'>
                {taskStats.done} / {taskStats.total || 0}
              </div>
              <div className='text-[11px] uppercase tracking-wide text-slate-500'>Completed</div>
            </div>
            <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-3'>
              <div className='font-semibold text-slate-700'>Your load</div>
              <div className='text-sm text-slate-900'>{userTaskCount}</div>
              <div className='text-[11px] uppercase tracking-wide text-slate-500'>Assigned</div>
            </div>
            <div className='rounded-xl border border-slate-100 bg-slate-50/60 p-3'>
              <div className='font-semibold text-slate-700'>Team</div>
              <div className='text-sm text-slate-900'>{workerCount}</div>
              <div className='text-[11px] uppercase tracking-wide text-slate-500'>Workers</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
