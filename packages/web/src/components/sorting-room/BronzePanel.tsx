import React, { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, Task } from '@lifebuild/shared/schema'
import { getCategoryInfo, type ProjectCategory } from '@lifebuild/shared'
import { generateRoute } from '../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../utils/navigation.js'
import { usePostHog } from '../../lib/analytics.js'

export interface BronzePanelProps {
  activeProjects: readonly Project[]
  backlogProjects: readonly Project[]
  allTasks: readonly Task[]
  onActivate: (project: Project) => void
  onMoveToBacklog: (project: Project) => void
  onQuickAddProject?: (name: string) => Promise<void>
}

interface ProjectWithDetails {
  project: Project
  taskCount: number
  completedCount: number
  categoryColor: string | null
}

const getCategoryColor = (project: Project | null | undefined): string | null => {
  if (!project?.category) return null
  const info = getCategoryInfo(project.category as ProjectCategory)
  return info?.colorHex ?? null
}

function buildTaskProgressMap(
  allTasks: readonly Task[]
): Map<string, { taskCount: number; completedCount: number }> {
  const map = new Map<string, { taskCount: number; completedCount: number }>()
  for (const task of allTasks) {
    if (!task.projectId || task.archivedAt) continue
    const current = map.get(task.projectId) || { taskCount: 0, completedCount: 0 }
    current.taskCount++
    if (task.status === 'done') current.completedCount++
    map.set(task.projectId, current)
  }
  return map
}

const ProgressBar: React.FC<{ completed: number; total: number }> = ({ completed, total }) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className='flex items-center gap-2'>
      <div className='flex-1 h-1.5 bg-[#e8e4de] rounded-full overflow-hidden'>
        <div
          className='h-full bg-[#c48b5a] rounded-full transition-all duration-300'
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className='text-[0.65rem] text-[#8b8680] whitespace-nowrap'>
        {completed}/{total}
      </span>
    </div>
  )
}

const QuickProjectEntry: React.FC<{
  onSubmit: (name: string) => Promise<void>
}> = ({ onSubmit }) => {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = name.trim()
      if (!trimmed || isSubmitting) return

      setIsSubmitting(true)
      try {
        await onSubmit(trimmed)
        setName('')
      } finally {
        setIsSubmitting(false)
      }
    },
    [name, isSubmitting, onSubmit]
  )

  return (
    <form className='flex items-stretch gap-2 min-h-[44px]' onSubmit={handleSubmit}>
      <input
        type='text'
        className='flex-1 px-3 h-[44px] border-2 border-dashed border-[#e8e4de] rounded-lg bg-[#faf9f7] text-sm text-[#2f2b27] transition-all duration-150 focus:outline-none focus:border-[#c48b5a] focus:border-solid focus:bg-white placeholder:text-[#8b8680]'
        placeholder='Quick add bronze project...'
        value={name}
        onChange={e => setName(e.target.value)}
        disabled={isSubmitting}
      />
      <button
        type='submit'
        className='px-3 h-[44px] flex-shrink-0 flex items-center justify-center border-none rounded-lg bg-[#c48b5a] text-white text-sm font-semibold cursor-pointer transition-all duration-150 hover:bg-[#a97548] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
        disabled={!name.trim() || isSubmitting}
      >
        {isSubmitting ? 'Adding...' : 'Add'}
      </button>
    </form>
  )
}

export const BronzePanel: React.FC<BronzePanelProps> = ({
  activeProjects,
  backlogProjects,
  allTasks,
  onActivate,
  onMoveToBacklog,
  onQuickAddProject,
}) => {
  const navigate = useNavigate()
  const posthog = usePostHog()
  const [queueView, setQueueView] = useState<'backlog' | 'active'>('backlog')

  const taskProgressMap = useMemo(() => buildTaskProgressMap(allTasks), [allTasks])

  const withDetails = useCallback(
    (project: Project): ProjectWithDetails => {
      const progress = taskProgressMap.get(project.id) ?? { taskCount: 0, completedCount: 0 }
      return {
        project,
        taskCount: progress.taskCount,
        completedCount: progress.completedCount,
        categoryColor: getCategoryColor(project),
      }
    },
    [taskProgressMap]
  )

  const activeWithDetails = useMemo(
    () => activeProjects.map(project => withDetails(project)),
    [activeProjects, withDetails]
  )

  const backlogWithDetails = useMemo(
    () => backlogProjects.map(project => withDetails(project)),
    [backlogProjects, withDetails]
  )

  const displayedProjects = queueView === 'backlog' ? backlogWithDetails : activeWithDetails

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex gap-0 mb-2 border border-[#e8e4de] rounded-lg overflow-hidden'>
        <button
          type='button'
          className={`flex-1 py-2 px-4 border-none text-sm font-medium cursor-pointer transition-all duration-150 ${
            queueView === 'backlog'
              ? 'bg-[#2f2b27] text-white'
              : 'bg-transparent text-[#8b8680] hover:bg-[#faf9f7]'
          }`}
          style={{ borderRight: '1px solid #e8e4de' }}
          onClick={() => setQueueView('backlog')}
        >
          Backlog ({backlogProjects.length})
        </button>
        <button
          type='button'
          className={`flex-1 py-2 px-4 border-none text-sm font-medium cursor-pointer transition-all duration-150 ${
            queueView === 'active'
              ? 'bg-[#2f2b27] text-white'
              : 'bg-transparent text-[#8b8680] hover:bg-[#faf9f7]'
          }`}
          onClick={() => setQueueView('active')}
        >
          Active ({activeProjects.length})
        </button>
      </div>

      {displayedProjects.length === 0 ? (
        <div className='p-4 text-[#8b8680] text-sm italic'>
          {queueView === 'backlog'
            ? 'No bronze projects in backlog. Create projects in the Drafting Room.'
            : 'No active bronze projects.'}
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {displayedProjects.map((item, index) => (
            <div
              key={item.project.id}
              className='flex flex-col gap-2 py-3.5 px-4 bg-white border border-[#e8e4de] rounded-xl transition-all duration-150 hover:border-[#8b8680] hover:bg-[#faf9f7]'
              style={{ borderLeftColor: item.categoryColor ?? '#c48b5a', borderLeftWidth: '4px' }}
            >
              <div className='flex items-start gap-3'>
                <span className='text-xs font-semibold text-[#8b8680] bg-[#faf9f7] py-1 px-2 rounded min-w-[2rem] text-center'>
                  #{index + 1}
                </span>
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-sm text-[#2f2b27] truncate'>
                    {item.project.name}
                  </div>
                  {item.project.description && (
                    <div className='text-xs text-[#8b8680] mt-0.5 truncate'>
                      {item.project.description}
                    </div>
                  )}
                </div>
                <div className='flex items-center gap-2 flex-shrink-0'>
                  <button
                    type='button'
                    className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
                    onClick={() =>
                      navigate(preserveStoreIdInUrl(generateRoute.project(item.project.id)))
                    }
                  >
                    View
                  </button>
                  {queueView === 'backlog' ? (
                    <button
                      type='button'
                      className='text-xs py-1.5 px-3 rounded-lg bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black whitespace-nowrap'
                      onClick={() => {
                        posthog?.capture('sorting_project_activated', {
                          stream: 'bronze',
                          projectId: item.project.id,
                        })
                        onActivate(item.project)
                        setQueueView('active')
                      }}
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      type='button'
                      className='text-xs py-1.5 px-3 rounded-lg bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black whitespace-nowrap'
                      onClick={() => {
                        posthog?.capture('sorting_project_moved_to_backlog', {
                          stream: 'bronze',
                          projectId: item.project.id,
                        })
                        onMoveToBacklog(item.project)
                      }}
                    >
                      Move to Backlog
                    </button>
                  )}
                </div>
              </div>
              {item.taskCount > 0 && (
                <ProgressBar completed={item.completedCount} total={item.taskCount} />
              )}
            </div>
          ))}
        </div>
      )}

      {onQuickAddProject && (
        <div className='mt-2'>
          <QuickProjectEntry onSubmit={onQuickAddProject} />
        </div>
      )}
    </div>
  )
}
