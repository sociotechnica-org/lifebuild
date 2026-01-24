import React, { useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Project, Task, TableBronzeProjectEntry } from '@lifebuild/shared/schema'
import {
  getCategoryInfo,
  type ProjectCategory,
  resolveLifecycleState,
  type LifecycleStream,
} from '@lifebuild/shared'
import { generateRoute } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'

export interface BronzePanelProps {
  /** Tabled bronze projects (from tableBronzeProjects table) */
  tabledProjects: readonly TableBronzeProjectEntry[]
  /** Available bronze projects not currently tabled */
  availableProjects: readonly Project[]
  /** All tasks (for computing project progress) */
  allTasks: readonly Task[]
  /** All projects (for resolving project details) */
  allProjects: readonly Project[]
  /** Called when a project is added to the table */
  onAddToTable?: (projectId: string) => void
  /** Called when a project is removed from the table */
  onRemoveFromTable?: (entryId: string) => void
  /** Called when tabled projects are reordered */
  onReorder?: (entries: Array<{ id: string; projectId: string }>) => void
  /** Called when quick-adding a new bronze project */
  onQuickAddProject?: (name: string) => Promise<void>
}

interface ProjectWithDetails {
  project: Project
  taskCount: number
  completedCount: number
  categoryColor: string | null
}

interface TabledProjectWithDetails extends ProjectWithDetails {
  entry: TableBronzeProjectEntry
}

/**
 * Get the category color for a project
 */
function getCategoryColor(project: Project | null | undefined): string | null {
  if (!project?.category) return null
  const info = getCategoryInfo(project.category as ProjectCategory)
  return info?.colorHex ?? null
}

// Stream color for bronze
const BRONZE_COLOR = '#c48b5a'

/**
 * Compute task progress for a project
 */
function getProjectTaskProgress(projectId: string, allTasks: readonly Task[]) {
  const projectTasks = allTasks.filter(t => t.projectId === projectId && !t.archivedAt)
  const completedTasks = projectTasks.filter(t => t.status === 'done')
  return {
    taskCount: projectTasks.length,
    completedCount: completedTasks.length,
  }
}

/**
 * Progress bar component
 */
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

/**
 * Sortable project card for tabled items (can be reordered)
 */
const SortableTabledProjectCard: React.FC<{
  item: TabledProjectWithDetails
  index: number
  onRemove?: () => void
  onView?: () => void
}> = ({ item, index, onRemove, onView }) => {
  const { entry, project, taskCount, completedCount, categoryColor } = item
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeftColor: categoryColor || BRONZE_COLOR,
    borderLeftWidth: '4px',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 py-3.5 px-4 bg-white border border-[#e8e4de] rounded-xl transition-all duration-150 hover:border-[#8b8680] hover:bg-[#faf9f7] ${
        isDragging ? 'shadow-lg rotate-2' : ''
      }`}
    >
      <div className='flex items-start gap-3'>
        <span
          className='text-xs font-semibold text-[#8b8680] bg-[#faf9f7] py-1 px-2 rounded min-w-[2rem] text-center cursor-grab hover:bg-black/5 active:cursor-grabbing'
          {...attributes}
          {...listeners}
        >
          #{index + 1}
        </span>
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-sm text-[#2f2b27] truncate'>{project.name}</div>
          {project.description && (
            <div className='text-xs text-[#8b8680] mt-0.5 truncate'>{project.description}</div>
          )}
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          {onView && (
            <button
              type='button'
              className='text-xs py-1.5 px-3 rounded-lg bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black whitespace-nowrap'
              onClick={onView}
            >
              View
            </button>
          )}
          {onRemove && (
            <button
              type='button'
              className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
              onClick={onRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {taskCount > 0 && <ProgressBar completed={completedCount} total={taskCount} />}
    </div>
  )
}

/**
 * Drag grip icon SVG
 */
const DragGripIcon: React.FC = () => (
  <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor' style={{ display: 'block' }}>
    <circle cx='5' cy='3' r='1.5' />
    <circle cx='11' cy='3' r='1.5' />
    <circle cx='5' cy='8' r='1.5' />
    <circle cx='11' cy='8' r='1.5' />
    <circle cx='5' cy='13' r='1.5' />
    <circle cx='11' cy='13' r='1.5' />
  </svg>
)

/**
 * Draggable available project card (can be dragged to tabled section)
 */
const DraggableAvailableProjectCard: React.FC<{
  item: ProjectWithDetails
  onAdd?: () => void
  onView?: () => void
}> = ({ item, onAdd, onView }) => {
  const { project, taskCount, completedCount, categoryColor } = item
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `available-${project.id}`,
    data: { type: 'available', projectId: project.id },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    borderLeftColor: categoryColor || '#e8e4de',
    borderLeftWidth: '4px',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 py-3.5 px-4 bg-white border border-[#e8e4de] rounded-xl transition-all duration-150 hover:border-[#8b8680] hover:bg-[#faf9f7] ${
        isDragging ? 'shadow-lg rotate-2' : ''
      }`}
    >
      <div className='flex items-start gap-3'>
        <span
          className='text-[#8b8680] py-2 px-1 -ml-1 cursor-grab hover:text-[#2f2b27] hover:bg-black/[0.08] rounded transition-all duration-150 active:cursor-grabbing'
          {...attributes}
          {...listeners}
        >
          <DragGripIcon />
        </span>
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-sm text-[#2f2b27] truncate'>{project.name}</div>
          {project.description && (
            <div className='text-xs text-[#8b8680] mt-0.5 truncate'>{project.description}</div>
          )}
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          {onView && (
            <button
              type='button'
              className='text-xs py-1.5 px-3 rounded-lg bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-150 hover:bg-[#faf9f7] hover:border-[#8b8680] hover:text-[#2f2b27] whitespace-nowrap'
              onClick={e => {
                e.stopPropagation()
                onView()
              }}
            >
              View
            </button>
          )}
          {onAdd && (
            <button
              type='button'
              className='text-xs py-1.5 px-3 rounded-lg bg-[#2f2b27] text-white border-none cursor-pointer transition-all duration-150 hover:bg-black whitespace-nowrap'
              onClick={e => {
                e.stopPropagation()
                onAdd()
              }}
            >
              Add to Table
            </button>
          )}
        </div>
      </div>
      {taskCount > 0 && <ProgressBar completed={completedCount} total={taskCount} />}
    </div>
  )
}

/**
 * Drop zone for tabled section (accepts drops from available)
 */
const TabledDropZone: React.FC<{
  children: React.ReactNode
  isEmpty: boolean
}> = ({ children, isEmpty }) => {
  const { setNodeRef } = useDroppable({
    id: 'tabled-drop-zone',
  })

  return (
    <div
      ref={setNodeRef}
      className='flex flex-col gap-2'
      style={{
        minHeight: isEmpty ? '100px' : undefined,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Footer area that swaps between quick add form and drop indicator
 */
const TabledFooter: React.FC<{
  isDraggingFromAvailable: boolean
  nextPosition: number
  onQuickAddProject?: (name: string) => Promise<void>
}> = ({ isDraggingFromAvailable, nextPosition, onQuickAddProject }) => {
  // When dragging from available, show drop indicator instead of quick add form
  if (isDraggingFromAvailable) {
    return (
      <div className='flex items-center gap-3 px-4 min-h-[44px] bg-[#c48b5a]/15 border-2 border-dashed border-[#c48b5a] rounded-lg animate-pulse'>
        <span className='text-xs font-semibold text-[#c48b5a]/70 bg-[#faf9f7] py-1 px-2 rounded min-w-[2rem] text-center'>
          #{nextPosition}
        </span>
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-sm text-[#c48b5a] italic opacity-80'>
            Drop to add to table
          </div>
        </div>
      </div>
    )
  }

  // Otherwise show the quick add form
  if (onQuickAddProject) {
    return <QuickProjectEntry onSubmit={onQuickAddProject} />
  }

  return null
}

/**
 * Drop zone for available section (accepts drops from tabled to remove)
 */
const AvailableDropZone: React.FC<{
  children: React.ReactNode
  isDraggingFromTabled: boolean
}> = ({ children, isDraggingFromTabled }) => {
  const { setNodeRef } = useDroppable({
    id: 'available-drop-zone',
  })

  return (
    <div ref={setNodeRef} className='flex flex-col gap-2'>
      {/* Drop indicator when dragging from tabled */}
      {isDraggingFromTabled && (
        <div className='flex items-center gap-3 px-4 min-h-[44px] bg-[#8b8680]/10 border-2 border-dashed border-[#8b8680] rounded-lg animate-pulse'>
          <div className='flex-1 min-w-0'>
            <div className='font-medium text-sm text-[#8b8680] italic opacity-80'>
              Drop to remove from table
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * Drag overlay for project cards
 */
const ProjectDragOverlay: React.FC<{
  item: TabledProjectWithDetails | ProjectWithDetails | null
  index?: number
  isAvailable?: boolean
}> = ({ item, index, isAvailable }) => {
  if (!item) return null

  const { project, taskCount, completedCount, categoryColor } = item

  return (
    <div
      className='flex flex-col gap-2 py-3.5 px-4 bg-white border border-[#e8e4de] rounded-xl shadow-lg'
      style={{
        borderLeftColor: categoryColor || (isAvailable ? '#e8e4de' : BRONZE_COLOR),
        borderLeftWidth: '4px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      }}
    >
      <div className='flex items-start gap-3'>
        {!isAvailable && index !== undefined && (
          <span className='text-xs font-semibold text-[#8b8680] bg-[#faf9f7] py-1 px-2 rounded min-w-[2rem] text-center'>
            #{index + 1}
          </span>
        )}
        <div className='flex-1 min-w-0'>
          <div className='font-medium text-sm text-[#2f2b27] truncate'>{project.name}</div>
          {project.description && (
            <div className='text-xs text-[#8b8680] mt-0.5 truncate'>{project.description}</div>
          )}
        </div>
      </div>
      {taskCount > 0 && <ProgressBar completed={completedCount} total={taskCount} />}
    </div>
  )
}

/**
 * Quick project entry form for adding bronze projects directly to the table
 */
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
        className='w-[44px] h-[44px] flex-shrink-0 flex items-center justify-center border-none rounded-lg bg-[#c48b5a] text-white text-xl font-semibold cursor-pointer transition-all duration-150 hover:bg-[#a97548] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
        disabled={!name.trim() || isSubmitting}
      >
        {isSubmitting ? '...' : '+'}
      </button>
    </form>
  )
}

/**
 * Bronze Panel - Shows tabled projects and available pool with drag-and-drop
 *
 * PR1 Task Queue Redesign: This panel now shows PROJECTS instead of tasks.
 * Tasks are managed separately via the Task Queue (PR2).
 */
export const BronzePanel: React.FC<BronzePanelProps> = ({
  tabledProjects,
  availableProjects,
  allTasks,
  allProjects,
  onAddToTable,
  onRemoveFromTable,
  onReorder,
  onQuickAddProject,
}) => {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'tabled' | 'available' | null>(null)

  const handleViewProject = useCallback(
    (projectId: string) => {
      navigate(preserveStoreIdInUrl(generateRoute.project(projectId)))
    },
    [navigate]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get project details for tabled items, filtering out entries with missing projects
  const tabledProjectsWithDetails = useMemo(() => {
    return tabledProjects
      .map(entry => {
        const project = allProjects.find(p => p.id === entry.projectId)
        if (!project) return null
        const { taskCount, completedCount } = getProjectTaskProgress(project.id, allTasks)
        const categoryColor = getCategoryColor(project)
        return { entry, project, taskCount, completedCount, categoryColor }
      })
      .filter((item): item is TabledProjectWithDetails => item !== null)
  }, [tabledProjects, allProjects, allTasks])

  // Get details for available projects
  const availableProjectsWithDetails = useMemo(() => {
    return availableProjects.map(project => {
      const { taskCount, completedCount } = getProjectTaskProgress(project.id, allTasks)
      const categoryColor = getCategoryColor(project)
      return { project, taskCount, completedCount, categoryColor }
    })
  }, [availableProjects, allTasks])

  // Get active item for drag overlay
  const activeTabledItem = useMemo(() => {
    if (!activeId || activeType !== 'tabled') return null
    return tabledProjectsWithDetails.find(item => item.entry.id === activeId)
  }, [activeId, activeType, tabledProjectsWithDetails])

  const activeAvailableItem = useMemo(() => {
    if (!activeId || activeType !== 'available') return null
    const projectId = activeId.replace('available-', '')
    return availableProjectsWithDetails.find(item => item.project.id === projectId)
  }, [activeId, activeType, availableProjectsWithDetails])

  const activeIndex = useMemo(() => {
    if (!activeId || activeType !== 'tabled') return -1
    return tabledProjectsWithDetails.findIndex(item => item.entry.id === activeId)
  }, [activeId, activeType, tabledProjectsWithDetails])

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string
    setActiveId(id)

    // Determine if dragging from tabled or available
    if (id.startsWith('available-')) {
      setActiveType('available')
    } else {
      setActiveType('tabled')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveType(null)

    if (!over) return

    const activeIdStr = active.id as string
    const overIdStr = over.id as string

    // Case 1: Dragging from available to tabled drop zone
    if (activeIdStr.startsWith('available-')) {
      const projectId = activeIdStr.replace('available-', '')
      // Drop on tabled drop zone or on a tabled item
      if (overIdStr === 'tabled-drop-zone' || !overIdStr.startsWith('available-')) {
        if (onAddToTable) {
          onAddToTable(projectId)
        }
      }
      return
    }

    // Case 2: Dragging from tabled to available drop zone (remove from table)
    if (overIdStr === 'available-drop-zone' || overIdStr.startsWith('available-')) {
      const tabledItem = tabledProjectsWithDetails.find(item => item.entry.id === activeIdStr)
      if (tabledItem && onRemoveFromTable) {
        onRemoveFromTable(tabledItem.entry.id)
      }
      return
    }

    // Case 3: Reordering within tabled
    if (activeIdStr === overIdStr) return

    const oldIndex = tabledProjectsWithDetails.findIndex(item => item.entry.id === activeIdStr)
    const newIndex = tabledProjectsWithDetails.findIndex(item => item.entry.id === overIdStr)

    if (oldIndex === -1 || newIndex === -1) return

    if (onReorder) {
      const reordered = arrayMove(tabledProjectsWithDetails, oldIndex, newIndex)
      onReorder(reordered.map(item => ({ id: item.entry.id, projectId: item.entry.projectId })))
    }
  }

  const sortableIds = tabledProjectsWithDetails.map(item => item.entry.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='flex flex-col gap-6'>
        {/* Tabled Section with drag-and-drop */}
        <div className='flex flex-col gap-3'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-[#8b8680] m-0'>
            ON TABLE ({tabledProjectsWithDetails.length})
          </h3>
          {tabledProjectsWithDetails.length === 0 ? (
            <TabledDropZone isEmpty={true}>
              <div className='flex flex-col items-center justify-center p-8 bg-black/[0.02] border-2 border-dashed border-[#e8e4de] rounded-xl text-center text-[#8b8680]'>
                <span>No bronze projects on table</span>
                <span className='text-sm mt-1 opacity-70'>
                  Drag projects here or click "Add to Table"
                </span>
              </div>
            </TabledDropZone>
          ) : (
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <TabledDropZone isEmpty={false}>
                {tabledProjectsWithDetails.map((item, index) => (
                  <SortableTabledProjectCard
                    key={item.entry.id}
                    item={item}
                    index={index}
                    onView={() => handleViewProject(item.project.id)}
                    onRemove={
                      onRemoveFromTable ? () => onRemoveFromTable(item.entry.id) : undefined
                    }
                  />
                ))}
              </TabledDropZone>
            </SortableContext>
          )}

          {/* Footer: Quick add form OR drop indicator when dragging */}
          <TabledFooter
            isDraggingFromAvailable={activeType === 'available'}
            nextPosition={tabledProjectsWithDetails.length + 1}
            onQuickAddProject={onQuickAddProject}
          />
        </div>

        {/* Available Section (Backlog) */}
        <div className='flex flex-col gap-3'>
          <h3 className='text-xs font-semibold uppercase tracking-wide text-[#8b8680] m-0'>
            BACKLOG ({availableProjects.length})
          </h3>
          <AvailableDropZone isDraggingFromTabled={activeType === 'tabled'}>
            {availableProjects.length === 0 && activeType !== 'tabled' ? (
              <div className='p-4 text-[#8b8680] text-sm italic'>
                No bronze projects in backlog. Create projects in the Drafting Room.
              </div>
            ) : (
              availableProjectsWithDetails.map(item => (
                <DraggableAvailableProjectCard
                  key={item.project.id}
                  item={item}
                  onView={() => handleViewProject(item.project.id)}
                  onAdd={onAddToTable ? () => onAddToTable(item.project.id) : undefined}
                />
              ))
            )}
          </AvailableDropZone>
        </div>
      </div>

      <DragOverlay>
        {activeTabledItem && <ProjectDragOverlay item={activeTabledItem} index={activeIndex} />}
        {activeAvailableItem && <ProjectDragOverlay item={activeAvailableItem} isAvailable />}
      </DragOverlay>
    </DndContext>
  )
}
