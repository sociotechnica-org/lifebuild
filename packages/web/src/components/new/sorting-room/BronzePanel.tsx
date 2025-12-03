import React, { useMemo, useState, useCallback } from 'react'
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
import type { Project, Task, TableBronzeStackEntry } from '@work-squared/shared/schema'
import {
  getCategoryInfo,
  type ProjectCategory,
  resolveLifecycleState,
  type LifecycleStream,
} from '@work-squared/shared'

export interface BronzePanelProps {
  tabledStack: readonly TableBronzeStackEntry[]
  availableTasks: readonly Task[]
  allTasks: readonly Task[]
  allProjects: readonly Project[]
  onAddToTable?: (taskId: string) => void
  onRemoveFromTable?: (entryId: string) => void
  onReorder?: (entries: Array<{ id: string; taskId: string }>) => void
  onQuickAddTask?: (title: string) => Promise<void>
}

interface TaskWithDetails {
  task: Task
  project: Project | null | undefined
  stream: LifecycleStream
  categoryColor: string | null
}

interface TabledTaskWithDetails extends TaskWithDetails {
  entry: TableBronzeStackEntry
}

/**
 * Get the stream from a project's lifecycle state
 */
function getProjectStream(project: Project | null | undefined): LifecycleStream {
  if (!project) return 'bronze'
  const lifecycle = resolveLifecycleState(project.projectLifecycleState, null)
  return lifecycle.stream ?? 'bronze'
}

/**
 * Get the category color for a project
 */
function getCategoryColor(project: Project | null | undefined): string | null {
  if (!project?.category) return null
  const info = getCategoryInfo(project.category as ProjectCategory)
  return info?.colorHex ?? null
}

/**
 * Sortable task card for tabled items (can be reordered)
 */
const SortableTabledTaskCard: React.FC<{
  item: TabledTaskWithDetails
  index: number
  onRemove?: () => void
}> = ({ item, index, onRemove }) => {
  const { entry, task, project, stream, categoryColor } = item
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeftColor: categoryColor || 'var(--bronze)',
    borderLeftWidth: '4px',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sorting-room-task-card tabled ${isDragging ? 'dragging' : ''}`}
    >
      <span
        className='sorting-room-queue-position sorting-room-drag-handle'
        {...attributes}
        {...listeners}
      >
        #{index + 1}
      </span>
      <div className='sorting-room-task-info'>
        <div className='sorting-room-task-title'>{task?.title ?? 'Unknown task'}</div>
        <div className='sorting-room-task-meta'>
          <span className={`sorting-room-stream-dot ${stream}`} />
          <span>{project?.name ?? 'Quick task'}</span>
        </div>
      </div>
      {task?.status && task.status !== 'todo' && (
        <span className='sorting-room-status-badge'>{task.status.replace('_', ' ')}</span>
      )}
      {onRemove && (
        <button type='button' className='sorting-room-action-btn release' onClick={onRemove}>
          Remove
        </button>
      )}
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
 * Draggable available task card (can be dragged to tabled section)
 */
const DraggableAvailableTaskCard: React.FC<{
  item: TaskWithDetails
  onAdd?: () => void
}> = ({ item, onAdd }) => {
  const { task, project, stream, categoryColor } = item
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `available-${task.id}`,
    data: { type: 'available', taskId: task.id },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    ...(categoryColor && {
      borderLeftColor: categoryColor,
      borderLeftWidth: '4px',
    }),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`sorting-room-task-card available ${isDragging ? 'dragging' : ''}`}
    >
      <span
        className='sorting-room-drag-handle sorting-room-grip-icon'
        {...attributes}
        {...listeners}
      >
        <DragGripIcon />
      </span>
      <div className='sorting-room-task-info'>
        <div className='sorting-room-task-title'>{task.title}</div>
        <div className='sorting-room-task-meta'>
          <span className={`sorting-room-stream-dot ${stream}`} />
          <span>{project?.name ?? 'Quick task'}</span>
        </div>
      </div>
      {task.status !== 'todo' && (
        <span className='sorting-room-status-badge'>{task.status.replace('_', ' ')}</span>
      )}
      {onAdd && (
        <button
          type='button'
          className='sorting-room-action-btn activate'
          onClick={e => {
            e.stopPropagation()
            onAdd()
          }}
        >
          Add to Table
        </button>
      )}
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
      className='sorting-room-queue-list'
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
  onQuickAddTask?: (title: string) => Promise<void>
}> = ({ isDraggingFromAvailable, nextPosition, onQuickAddTask }) => {
  // When dragging from available, show drop indicator instead of quick add form
  if (isDraggingFromAvailable) {
    return (
      <div className='sorting-room-drop-indicator sorting-room-footer-height'>
        <span className='sorting-room-queue-position'>#{nextPosition}</span>
        <div className='sorting-room-task-info'>
          <div className='sorting-room-task-title sorting-room-drop-placeholder'>
            Drop to add to table
          </div>
        </div>
      </div>
    )
  }

  // Otherwise show the quick add form
  if (onQuickAddTask) {
    return <QuickTaskEntry onSubmit={onQuickAddTask} />
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
    <div ref={setNodeRef} className='sorting-room-queue-list'>
      {/* Drop indicator when dragging from tabled */}
      {isDraggingFromTabled && (
        <div className='sorting-room-drop-indicator remove'>
          <div className='sorting-room-task-info'>
            <div className='sorting-room-task-title sorting-room-drop-placeholder'>
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
 * Drag overlay for task cards
 */
const TaskDragOverlay: React.FC<{
  item: TabledTaskWithDetails | TaskWithDetails | null
  index?: number
  isAvailable?: boolean
}> = ({ item, index, isAvailable }) => {
  if (!item) return null

  const { task, project, stream, categoryColor } = item

  return (
    <div
      className={`sorting-room-task-card ${isAvailable ? 'available' : 'tabled'} dragging`}
      style={{
        borderLeftColor: categoryColor || (isAvailable ? 'var(--border)' : 'var(--bronze)'),
        borderLeftWidth: '4px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      }}
    >
      {!isAvailable && index !== undefined && (
        <span className='sorting-room-queue-position'>#{index + 1}</span>
      )}
      <div className='sorting-room-task-info'>
        <div className='sorting-room-task-title'>{task?.title ?? 'Unknown task'}</div>
        <div className='sorting-room-task-meta'>
          <span className={`sorting-room-stream-dot ${stream}`} />
          <span>{project?.name ?? 'Quick task'}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Quick task entry form for adding orphaned tasks directly to the table
 */
const QuickTaskEntry: React.FC<{
  onSubmit: (title: string) => Promise<void>
}> = ({ onSubmit }) => {
  const [title, setTitle] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const trimmed = title.trim()
      if (!trimmed || isSubmitting) return

      setIsSubmitting(true)
      try {
        await onSubmit(trimmed)
        setTitle('')
      } finally {
        setIsSubmitting(false)
      }
    },
    [title, isSubmitting, onSubmit]
  )

  return (
    <form className='sorting-room-quick-add' onSubmit={handleSubmit}>
      <input
        type='text'
        className='sorting-room-quick-add-input'
        placeholder='Quick add task to table...'
        value={title}
        onChange={e => setTitle(e.target.value)}
        disabled={isSubmitting}
      />
      <button
        type='submit'
        className='sorting-room-quick-add-btn'
        disabled={!title.trim() || isSubmitting}
      >
        {isSubmitting ? '...' : '+'}
      </button>
    </form>
  )
}

/**
 * Bronze Panel - Shows tabled tasks and available pool with drag-and-drop
 */
export const BronzePanel: React.FC<BronzePanelProps> = ({
  tabledStack,
  availableTasks,
  allTasks,
  allProjects,
  onAddToTable,
  onRemoveFromTable,
  onReorder,
  onQuickAddTask,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeType, setActiveType] = useState<'tabled' | 'available' | null>(null)

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

  // Get task details for tabled items, filtering out entries with missing tasks
  const tabledTasksWithDetails = useMemo(() => {
    return tabledStack
      .map(entry => {
        const task = allTasks.find(t => t.id === entry.taskId)
        if (!task) return null
        const project = task.projectId ? allProjects.find(p => p.id === task.projectId) : null
        const stream = getProjectStream(project)
        const categoryColor = getCategoryColor(project)
        return { entry, task, project, stream, categoryColor }
      })
      .filter((item): item is TabledTaskWithDetails => item !== null)
  }, [tabledStack, allTasks, allProjects])

  // Get project details for available tasks
  const availableTasksWithDetails = useMemo(() => {
    return availableTasks.map(task => {
      const project = task.projectId ? allProjects.find(p => p.id === task.projectId) : null
      const stream = getProjectStream(project)
      const categoryColor = getCategoryColor(project)
      return { task, project, stream, categoryColor }
    })
  }, [availableTasks, allProjects])

  // Get active item for drag overlay
  const activeTabledItem = useMemo(() => {
    if (!activeId || activeType !== 'tabled') return null
    return tabledTasksWithDetails.find(item => item.entry.id === activeId)
  }, [activeId, activeType, tabledTasksWithDetails])

  const activeAvailableItem = useMemo(() => {
    if (!activeId || activeType !== 'available') return null
    const taskId = activeId.replace('available-', '')
    return availableTasksWithDetails.find(item => item.task.id === taskId)
  }, [activeId, activeType, availableTasksWithDetails])

  const activeIndex = useMemo(() => {
    if (!activeId || activeType !== 'tabled') return -1
    return tabledTasksWithDetails.findIndex(item => item.entry.id === activeId)
  }, [activeId, activeType, tabledTasksWithDetails])

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
      const taskId = activeIdStr.replace('available-', '')
      // Drop on tabled drop zone or on a tabled item
      if (overIdStr === 'tabled-drop-zone' || !overIdStr.startsWith('available-')) {
        if (onAddToTable) {
          onAddToTable(taskId)
        }
      }
      return
    }

    // Case 2: Dragging from tabled to available drop zone (remove from table)
    if (overIdStr === 'available-drop-zone' || overIdStr.startsWith('available-')) {
      const tabledItem = tabledTasksWithDetails.find(item => item.entry.id === activeIdStr)
      if (tabledItem && onRemoveFromTable) {
        onRemoveFromTable(tabledItem.entry.id)
      }
      return
    }

    // Case 3: Reordering within tabled
    if (activeIdStr === overIdStr) return

    const oldIndex = tabledTasksWithDetails.findIndex(item => item.entry.id === activeIdStr)
    const newIndex = tabledTasksWithDetails.findIndex(item => item.entry.id === overIdStr)

    if (oldIndex === -1 || newIndex === -1) return

    if (onReorder) {
      const reordered = arrayMove(tabledTasksWithDetails, oldIndex, newIndex)
      onReorder(reordered.map(item => ({ id: item.entry.id, taskId: item.entry.taskId })))
    }
  }

  const sortableIds = tabledTasksWithDetails.map(item => item.entry.id)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className='sorting-room-stream-panel'>
        {/* Validation warning - above tabled section */}
        {tabledTasksWithDetails.length < 3 && (
          <div className='sorting-room-warning'>
            ⚠️ Minimum 3 bronze tasks recommended.{' '}
            {tabledTasksWithDetails.length === 0
              ? 'Add tasks to get started.'
              : `Add ${3 - tabledTasksWithDetails.length} more.`}
          </div>
        )}

        {/* Tabled Section with drag-and-drop */}
        <div className='sorting-room-section'>
          <h3 className='sorting-room-section-title'>TABLED ({tabledTasksWithDetails.length})</h3>
          {tabledTasksWithDetails.length === 0 ? (
            <TabledDropZone isEmpty={true}>
              <div className='sorting-room-empty-slot'>
                <span>No bronze tasks on table</span>
                <span className='sorting-room-empty-hint'>
                  Drag tasks here or click "Add to Table"
                </span>
              </div>
            </TabledDropZone>
          ) : (
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <TabledDropZone isEmpty={false}>
                {tabledTasksWithDetails.map((item, index) => (
                  <SortableTabledTaskCard
                    key={item.entry.id}
                    item={item}
                    index={index}
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
            nextPosition={tabledTasksWithDetails.length + 1}
            onQuickAddTask={onQuickAddTask}
          />
        </div>

        {/* Available Section */}
        <div className='sorting-room-section'>
          <h3 className='sorting-room-section-title'>AVAILABLE ({availableTasks.length})</h3>
          <AvailableDropZone isDraggingFromTabled={activeType === 'tabled'}>
            {availableTasks.length === 0 && activeType !== 'tabled' ? (
              <div className='sorting-room-empty-queue'>
                No available tasks. Tasks from active projects will appear here.
              </div>
            ) : (
              availableTasksWithDetails.map(item => (
                <DraggableAvailableTaskCard
                  key={item.task.id}
                  item={item}
                  onAdd={onAddToTable ? () => onAddToTable(item.task.id) : undefined}
                />
              ))
            )}
          </AvailableDropZone>
        </div>
      </div>

      <DragOverlay>
        {activeTabledItem && <TaskDragOverlay item={activeTabledItem} index={activeIndex} />}
        {activeAvailableItem && <TaskDragOverlay item={activeAvailableItem} isAvailable />}
      </DragOverlay>
    </DndContext>
  )
}
