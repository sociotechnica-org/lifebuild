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
import { TaskDetailModal, formatDeadline } from '../project-room/TaskDetailModal.js'
import { usePostHog } from '../../../lib/analytics.js'

/**
 * Document icon component for indicating task has description
 */
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      />
    </svg>
  )
}

/**
 * Parse task attributes to get deadline
 */
function getTaskDeadline(task: Task): number | undefined {
  if (!task.attributes) return undefined
  try {
    const attrs =
      typeof task.attributes === 'string' ? JSON.parse(task.attributes) : task.attributes
    return attrs?.deadline
  } catch {
    return undefined
  }
}

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
 * Sortable task row component with modal-based editing
 */
const SortableTaskRow: React.FC<{
  task: Task
  onEditTask: (task: Task) => void
  onRemove: (e: React.MouseEvent) => void
}> = ({ task, onEditTask, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const deadline = getTaskDeadline(task)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 bg-[#faf9f7] rounded-lg border border-[#e8e4de] cursor-pointer hover:border-[#d0ccc5] transition-colors ${
        isDragging ? 'shadow-lg rotate-1' : ''
      }`}
      onClick={() => onEditTask(task)}
      title='Click to edit task'
    >
      <span
        className='text-[#8b8680] py-1.5 px-1 cursor-grab hover:text-[#2f2b27] hover:bg-black/[0.08] rounded transition-all duration-150 active:cursor-grabbing flex-shrink-0'
        {...attributes}
        {...listeners}
        onClick={e => e.stopPropagation()} // Prevent click-to-edit when dragging
      >
        <DragGripIcon />
      </span>
      <span className='flex-1 text-sm text-[#2f2b27]'>{task.title}</span>

      {/* Description indicator icon */}
      {task.description && <DocumentIcon className='w-4 h-4 text-[#8b8680] flex-shrink-0' />}

      {/* Deadline display */}
      {deadline && (
        <span className='text-xs text-[#8b8680] flex-shrink-0'>{formatDeadline(deadline)}</span>
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
  const posthog = usePostHog()
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

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreatingTask, setIsCreatingTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

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
   * Open modal to create a new task
   */
  const handleAddTask = () => {
    setSelectedTask(null)
    setIsCreatingTask(true)
    setIsModalOpen(true)
  }

  /**
   * Open modal to edit an existing task
   */
  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setIsCreatingTask(false)
    setIsModalOpen(true)
  }

  /**
   * Close the modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsCreatingTask(false)
    setSelectedTask(null)
  }

  /**
   * Remove a task (delete it)
   */
  const handleRemoveTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation() // Prevent opening the modal
    store.commit(
      events.taskDeleted({
        taskId,
        deletedAt: new Date(),
        actorId: user?.id,
      })
    )
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
    posthog?.capture('project_stage_completed', { stage: 3, projectId })
    // Project moves to backlog, navigate to Sorting Room with matching stream open
    const stream = lifecycleState?.stream as 'gold' | 'silver' | 'bronze' | undefined
    navigate(generateRoute.sortingRoom(stream))
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

        {/* Header */}
        <div className='mb-4'>
          <h1 className="font-['Source_Serif_4',Georgia,serif] text-2xl font-bold text-[#2f2b27]">
            Stage 3: Detail
          </h1>
        </div>

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

        {/* Task List with Drag-and-Drop */}
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
                    onEditTask={handleEditTask}
                    onRemove={e => handleRemoveTask(e, task.id)}
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
                  {activeTask.description && (
                    <DocumentIcon className='w-4 h-4 text-[#8b8680] flex-shrink-0' />
                  )}
                  {getTaskDeadline(activeTask) && (
                    <span className='text-xs text-[#8b8680] flex-shrink-0'>
                      {formatDeadline(getTaskDeadline(activeTask)!)}
                    </span>
                  )}
                  <span className='text-xs text-[#8b8680] flex-shrink-0'>Remove</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Add Task button */}
          <button
            type='button'
            className='py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#2f2b27] text-[#faf9f7] cursor-pointer border-none transition-all duration-200 hover:bg-[#4a4540]'
            onClick={handleAddTask}
          >
            + Add Task
          </button>

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
            Add to Sorting
          </button>
        </div>
      </div>

      {/* Task Modal for creating/editing tasks */}
      {isModalOpen && (
        <TaskDetailModal
          task={selectedTask}
          allTasks={tasks}
          onClose={handleCloseModal}
          projectId={projectId}
          isCreating={isCreatingTask}
          hideStatus={true}
        />
      )}
    </div>
  )
}
