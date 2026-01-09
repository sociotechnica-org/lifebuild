import React, { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '../../../livestore-compat.js'
import { events, type Task } from '@lifebuild/shared/schema'
import { getProjectById$, getProjectTasks$ } from '@lifebuild/shared/queries'
import {
  type ProjectCategory,
  type ProjectLifecycleState,
  getCategoryInfo,
  resolveLifecycleState,
} from '@lifebuild/shared'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
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
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import { StageWizard, type WizardStage } from './StageWizard.js'
import { useRoomChatControl } from '../layout/RoomLayout.js'

/**
 * Drag grip icon SVG (6 dots in 2x3 grid)
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
 * Sortable task row component
 */
const SortableTaskRow: React.FC<{
  task: Task
  isEditing: boolean
  editingTitle: string
  onStartEdit: () => void
  onEditChange: (value: string) => void
  onSaveEdit: () => void
  onEditKeyDown: (e: React.KeyboardEvent) => void
  onRemove: () => void
}> = ({
  task,
  isEditing,
  editingTitle,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onEditKeyDown,
  onRemove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-[#faf9f7] rounded-lg border border-[#e8e4de] ${
        isDragging ? 'shadow-lg rotate-1' : ''
      }`}
    >
      <span
        className='text-[#8b8680] py-1.5 px-1 cursor-grab hover:text-[#2f2b27] hover:bg-black/[0.08] rounded transition-all duration-150 active:cursor-grabbing flex-shrink-0'
        {...attributes}
        {...listeners}
      >
        <DragGripIcon />
      </span>
      {isEditing ? (
        <input
          type='text'
          className='flex-1 border border-[#e8e4de] rounded-lg py-2 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5]'
          value={editingTitle}
          onChange={e => onEditChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={onEditKeyDown}
          autoFocus
        />
      ) : (
        <span
          className='flex-1 text-sm text-[#2f2b27] cursor-pointer hover:text-[#4a4540]'
          onClick={onStartEdit}
          title='Click to edit'
        >
          {task.title}
        </span>
      )}
      <button
        type='button'
        className='text-xs text-[#8b8680] bg-transparent border-none cursor-pointer hover:text-red-600 flex-shrink-0'
        onClick={onRemove}
      >
        Remove
      </button>
    </div>
  )
}

export const Stage3Form: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { store } = useStore()
  const { user } = useAuth()
  const { openChat, sendDirectMessage } = useRoomChatControl()

  // Load existing project
  const projectResults = useQuery(getProjectById$(projectId ?? ''))
  const project = projectResults?.[0] ?? null

  // Load existing tasks for this project
  const allTasks = useQuery(getProjectTasks$(projectId ?? '')) ?? []
  const tasks = useMemo(
    () => allTasks.filter(t => !t.archivedAt).sort((a, b) => a.position - b.position),
    [allTasks]
  )

  // New task input
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Track which task is being edited
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Get current lifecycle state
  const lifecycleState: ProjectLifecycleState | null = project
    ? resolveLifecycleState(project.projectLifecycleState, null)
    : null

  // User can only navigate back to stages they've already completed (current stage or earlier)
  const maxAccessibleStage: WizardStage = (() => {
    if (!lifecycleState) return 3 // Default to stage 3 since we're on this form
    const stage = lifecycleState.stage ?? 1
    // Allow access to current stage, but at least 3 since we're on this form
    return Math.min(3, Math.max(3, stage)) as WizardStage
  })()

  // Check if we have at least one task to advance
  const hasAtLeastOneTask = tasks.length > 0

  // Drag-and-drop state
  const [activeId, setActiveId] = useState<string | null>(null)

  // Configure sensors for drag activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Requires 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Get sortable IDs for SortableContext
  const sortableIds = useMemo(() => tasks.map(t => t.id), [tasks])

  // Find the active task for drag overlay
  const activeTask = useMemo(
    () => (activeId ? tasks.find(t => t.id === activeId) : null),
    [activeId, tasks]
  )

  /**
   * Handle drag start - track which item is being dragged
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  /**
   * Handle drag end - update task positions in LiveStore
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) return

    const oldIndex = tasks.findIndex(t => t.id === active.id)
    const newIndex = tasks.findIndex(t => t.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Calculate new order using arrayMove
    const reorderedTasks = arrayMove(tasks, oldIndex, newIndex)

    // Update positions for all affected tasks
    const now = new Date()
    reorderedTasks.forEach((task, index) => {
      // Only update tasks whose position changed
      if (task.position !== index) {
        store.commit(
          events.taskReordered({
            taskId: task.id,
            position: index,
            updatedAt: now,
            actorId: user?.id,
          })
        )
      }
    })
  }

  /**
   * Add a new task
   */
  const handleAddTask = () => {
    if (!projectId || !newTaskTitle.trim()) return

    const taskId = crypto.randomUUID()
    const now = new Date()
    const maxPosition = tasks.length > 0 ? Math.max(...tasks.map(t => t.position)) : -1

    store.commit(
      events.taskCreatedV2({
        id: taskId,
        projectId,
        title: newTaskTitle.trim(),
        description: undefined,
        status: 'todo',
        assigneeIds: undefined,
        position: maxPosition + 1,
        createdAt: now,
        actorId: user?.id,
      })
    )

    setNewTaskTitle('')
  }

  /**
   * Remove a task (delete it)
   */
  const handleRemoveTask = (taskId: string) => {
    store.commit(
      events.taskDeleted({
        taskId,
        deletedAt: new Date(),
        actorId: user?.id,
      })
    )
  }

  /**
   * Start editing a task
   */
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id)
    setEditingTitle(task.title)
  }

  /**
   * Save task edit
   */
  const handleSaveEdit = () => {
    if (!editingTaskId || !editingTitle.trim()) {
      setEditingTaskId(null)
      setEditingTitle('')
      return
    }

    store.commit(
      events.taskUpdated({
        taskId: editingTaskId,
        title: editingTitle.trim(),
        description: undefined,
        assigneeIds: undefined,
        updatedAt: new Date(),
        actorId: user?.id,
      })
    )

    setEditingTaskId(null)
    setEditingTitle('')
  }

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingTaskId(null)
    setEditingTitle('')
  }

  /**
   * Handle key press in edit input
   */
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  /**
   * Handle key press in new task input
   */
  const handleNewTaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask()
    }
  }

  /**
   * Save and advance to Stage 4 (Prioritizing) and move to backlog
   */
  const saveAndAdvance = () => {
    if (!projectId || !hasAtLeastOneTask || !lifecycleState) return

    const now = new Date()

    // Update lifecycle state to stage 4 and status to backlog
    const updatedLifecycle: ProjectLifecycleState = {
      ...lifecycleState,
      stage: 4, // Advance to Stage 4 (Prioritizing)
      status: 'backlog', // Move to backlog for sorting
    }

    store.commit(
      events.projectLifecycleUpdated({
        projectId,
        lifecycleState: updatedLifecycle,
        updatedAt: now,
        actorId: user?.id,
      })
    )
  }

  const handleExit = () => {
    navigate(generateRoute.draftingRoom())
  }

  const handleContinue = () => {
    if (!hasAtLeastOneTask) return
    saveAndAdvance()
    // Project moves to backlog, navigate to Sorting Room
    navigate(generateRoute.sortingRoom())
  }

  if (!project) {
    return (
      <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
        <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-2xl'>
          <p>Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className='flex items-start justify-center min-h-[calc(100vh-200px)] py-8'>
      <div className='bg-white rounded-2xl border border-[#e8e4de] shadow-sm p-6 w-full max-w-2xl'>
        {/* Wizard Navigation */}
        {projectId && (
          <StageWizard
            projectId={projectId}
            currentStage={3}
            maxAccessibleStage={maxAccessibleStage}
          />
        )}

        {/* Project Title and Category */}
        {project && (
          <div className='flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#e8e4de]'>
            <div className='font-semibold text-lg text-[#2f2b27]'>
              {project.name || 'Untitled Project'}
            </div>
            {project.category && getCategoryInfo(project.category as ProjectCategory) && (
              <span
                className='text-[10px] font-semibold tracking-wide text-white py-0.5 px-1.5 rounded'
                style={{
                  backgroundColor: getCategoryInfo(project.category as ProjectCategory)!.colorHex,
                }}
              >
                {getCategoryInfo(project.category as ProjectCategory)!.name}
              </span>
            )}
          </div>
        )}

        {/* Header */}
        <div className='mb-6'>
          <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27] mb-1">
            Stage 3: Draft
          </h1>
          <p className='text-sm text-[#8b8680]'>Create actionable task list - 30 minutes</p>
        </div>

        {/* Task List */}
        <div className='flex flex-col gap-5'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              <div className='flex flex-col gap-2'>
                {tasks.map(task => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    isEditing={editingTaskId === task.id}
                    editingTitle={editingTitle}
                    onStartEdit={() => handleStartEdit(task)}
                    onEditChange={setEditingTitle}
                    onSaveEdit={handleSaveEdit}
                    onEditKeyDown={handleEditKeyDown}
                    onRemove={() => handleRemoveTask(task.id)}
                  />
                ))}
              </div>
            </SortableContext>

            {/* Drag overlay - shows ghosted copy during drag */}
            <DragOverlay>
              {activeTask && (
                <div className='flex items-center gap-2 p-3 bg-[#faf9f7] rounded-lg border border-[#e8e4de] shadow-lg rotate-2'>
                  <span className='text-[#8b8680] py-1.5 px-1 flex-shrink-0'>
                    <DragGripIcon />
                  </span>
                  <span className='flex-1 text-sm text-[#2f2b27]'>{activeTask.title}</span>
                  <span className='text-xs text-[#8b8680] flex-shrink-0'>Remove</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Add new task input */}
          <div className='flex gap-2'>
            <input
              type='text'
              className='flex-1 border border-[#e8e4de] rounded-lg py-2.5 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5] placeholder:text-[#8b8680]'
              placeholder='Add a new task...'
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={handleNewTaskKeyDown}
            />
            <button
              type='button'
              className='py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none transition-all duration-200 hover:bg-[#4a4540] disabled:opacity-50 disabled:cursor-not-allowed'
              onClick={handleAddTask}
              disabled={!newTaskTitle.trim()}
            >
              Add
            </button>
          </div>

          {/* Ask Marvin button */}
          <button
            type='button'
            className='w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-200 hover:border-[#d0ccc5] hover:text-[#2f2b27]'
            onClick={() => {
              const existingTasks = tasks.map(t => t.title).join(', ')

              let message = `Please help me draft a task list for this project.`
              if (existingTasks) {
                message += ` I already have these tasks: ${existingTasks}.`
              }
              message += ` Please suggest additional tasks to complete this project. Ask me clarifying questions if you need more context about the project scope or goals.`

              // Open the chat panel
              openChat()

              // Send the message with navigation context attached
              sendDirectMessage(message)
            }}
          >
            Ask Marvin to draft tasks
          </button>
        </div>

        {/* Footer Actions */}
        <div className='flex gap-3 mt-6 pt-4 border-t border-[#e8e4de]'>
          <button
            type='button'
            className='flex-1 py-2.5 px-4 rounded-lg text-sm font-medium bg-transparent border border-[#e8e4de] text-[#8b8680] cursor-pointer transition-all duration-200 hover:border-[#d0ccc5] hover:text-[#2f2b27]'
            onClick={handleExit}
          >
            Save & Exit
          </button>
          <button
            type='button'
            className='flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none transition-all duration-200 hover:bg-[#4a4540] disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={handleContinue}
            disabled={!hasAtLeastOneTask}
          >
            Add to Backlog
          </button>
        </div>
      </div>
    </div>
  )
}
