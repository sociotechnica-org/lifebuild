import React, { useState, useEffect, useMemo } from 'react'
import { useStore } from '../../../livestore-compat.js'
import { formatDate } from '../../../utils/dates.js'
import type { Project, Worker, WorkerProject } from '@lifebuild/shared/schema'
import { getProjectWorkers$, getWorkers$ } from '@lifebuild/shared/queries'
import { getAvatarColor } from '../../../utils/avatarColors.js'
import { ProjectCategoryBadge } from '../ProjectCategoryBadge.js'
import { describeProjectLifecycleState, resolveLifecycleState } from '@lifebuild/shared'
import type { PlanningAttributes } from '@lifebuild/shared'
import { PROJECT_CATEGORIES } from '@lifebuild/shared'

interface ProjectCardProps {
  project: Project
  onClick?: () => void
}

// Helper to get full image URL from relative path
const getFullImageUrl = (url: string): string => {
  if (!url) return ''
  // If already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // Otherwise, prepend the worker URL
  const syncUrl = import.meta.env.VITE_LIVESTORE_SYNC_URL || 'http://localhost:8787'
  const httpUrl = syncUrl.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:')
  return `${httpUrl}${url}`
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const { store } = useStore()
  const [assignedWorkers, setAssignedWorkers] = useState<Worker[]>([])

  useEffect(() => {
    const loadAssignedWorkers = async () => {
      try {
        const [projectWorkers, allWorkers] = await Promise.all([
          store.query(getProjectWorkers$(project.id)) as WorkerProject[],
          store.query(getWorkers$) as Worker[],
        ])

        const assignedWorkerIds = new Set(projectWorkers.map(pw => pw.workerId))
        const assigned = allWorkers.filter(worker => assignedWorkerIds.has(worker.id))
        setAssignedWorkers(assigned)
      } catch (error) {
        console.error('Error loading assigned workers:', error)
      }
    }

    loadAssignedWorkers()
  }, [project.id, store])

  const attributes = useMemo(() => {
    try {
      return (project.attributes as PlanningAttributes | null) ?? null
    } catch {
      return null
    }
  }, [project.attributes])

  const lifecycleLabel = useMemo(
    () =>
      describeProjectLifecycleState(
        resolveLifecycleState(project.projectLifecycleState, attributes ?? null)
      ),
    [project.projectLifecycleState, attributes]
  )

  const category = PROJECT_CATEGORIES.find(c => c.value === project.category)
  const accentColor = category?.colorHex ?? '#c56b45'

  const coverImageUrl = (project.attributes as any)?.coverImage
  const fullImageUrl = coverImageUrl ? getFullImageUrl(coverImageUrl) : null

  return (
    <div
      className='relative overflow-hidden rounded-2xl border border-amber-100/80 bg-gradient-to-br from-amber-50 via-white to-stone-100 shadow-lg shadow-amber-100/40 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer'
      onClick={onClick}
    >
      <div
        className='pointer-events-none absolute inset-0 opacity-50 mix-blend-multiply'
        style={{
          backgroundImage:
            'radial-gradient(circle at 10% 20%, rgba(255,238,210,0.5), transparent 25%), radial-gradient(circle at 80% 10%, rgba(196,181,150,0.35), transparent 30%), radial-gradient(circle at 40% 80%, rgba(255,255,255,0.45), transparent 35%)',
        }}
      />
      <div className='absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_center,_#0f172a_0,_transparent_35%)] mix-blend-soft-light pointer-events-none' />
      <div className='absolute left-6 top-6 z-10 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700'>
        <span
          className='inline-flex items-center rounded-full px-3 py-1 shadow-sm'
          style={{
            backgroundColor: '#fff8f0',
            color: accentColor,
            border: `1px solid ${accentColor}30`,
          }}
        >
          {lifecycleLabel}
        </span>
      </div>
      {fullImageUrl && (
        <div className='relative w-full h-44 overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-b from-black/10 via-black/0 to-black/25 z-10' />
          <img
            src={fullImageUrl}
            alt={`${project.name} cover`}
            className='w-full h-full object-cover scale-[1.02]'
          />
        </div>
      )}
      <div className='relative z-10 p-6 space-y-4'>
        <div className='flex items-start justify-between gap-3'>
          <div className='space-y-1'>
            <div className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
              {project.category ? (
                <ProjectCategoryBadge category={project.category as any} size='sm' />
              ) : (
                'Uncategorized'
              )}
            </div>
            <h3 className='text-xl font-semibold text-slate-900 leading-tight'>{project.name}</h3>
            {project.description && (
              <p className='text-sm text-slate-700/80 leading-relaxed line-clamp-2'>
                {project.description}
              </p>
            )}
          </div>
          <div
            className='flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 shadow-inner'
            style={{ border: `1px solid ${accentColor}30` }}
          >
            <div className='text-[10px] font-semibold text-slate-500 leading-tight'>
              Created
              <div className='text-sm text-slate-900'>{formatDate(project.createdAt)}</div>
            </div>
          </div>
        </div>

        {assignedWorkers.length > 0 && (
          <div className='rounded-xl border border-amber-100/70 bg-white/80 p-3 shadow-inner'>
            <div className='text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2'>
              Assigned Team
            </div>
            <div className='flex flex-wrap gap-2'>
              {assignedWorkers.slice(0, 4).map(worker => (
                <span
                  key={worker.id}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm ${getAvatarColor(worker.id)}`}
                >
                  {worker.avatar && <span className='text-base leading-none'>{worker.avatar}</span>}
                  {worker.name}
                </span>
              ))}
              {assignedWorkers.length > 4 && (
                <span className='inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 shadow-sm'>
                  +{assignedWorkers.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className='grid grid-cols-3 gap-3'>
          <div className='rounded-xl bg-white/80 p-3 shadow-inner border border-amber-100/70'>
            <div className='text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold'>
              Updated
            </div>
            <div className='text-sm font-semibold text-slate-900'>
              {formatDate(project.updatedAt)}
            </div>
          </div>
          <div className='rounded-xl bg-white/80 p-3 shadow-inner border border-amber-100/70'>
            <div className='text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold'>
              Team
            </div>
            <div className='text-sm font-semibold text-slate-900'>
              {assignedWorkers.length > 0 ? assignedWorkers.length : 'None'}
            </div>
          </div>
          <div className='rounded-xl bg-white/80 p-3 shadow-inner border border-amber-100/70'>
            <div className='text-[11px] uppercase tracking-[0.12em] text-slate-500 font-semibold'>
              Lifecycle
            </div>
            <div className='text-sm font-semibold text-slate-900'>{lifecycleLabel}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
