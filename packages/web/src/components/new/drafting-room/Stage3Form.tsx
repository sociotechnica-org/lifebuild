import React, { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useQuery } from '@livestore/react'
import { events, type Task } from '@work-squared/shared/schema'
import { getProjectById$, getProjectTasks$ } from '@work-squared/shared/queries'
import {
  type ProjectCategory,
  type ProjectLifecycleState,
  getCategoryInfo,
  resolveLifecycleState,
} from '@work-squared/shared'
import { useAuth } from '../../../contexts/AuthContext.js'
import { generateRoute } from '../../../constants/routes.js'
import { StageWizard, type WizardStage } from './StageWizard.js'
import { useRoomChatControl } from '../layout/RoomLayout.js'

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
          <div className='flex items-center gap-2 mb-4'>
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
            Stage 3: Drafting
          </h1>
          <p className='text-sm text-[#8b8680]'>Create actionable task list - 30 minutes</p>
        </div>

        {/* Task List */}
        <div className='flex flex-col gap-5'>
          <div className='flex flex-col gap-2'>
            {tasks.map(task => (
              <div
                key={task.id}
                className='flex items-center gap-2 p-3 bg-[#faf9f7] rounded-lg border border-[#e8e4de]'
              >
                {editingTaskId === task.id ? (
                  <input
                    type='text'
                    className='flex-1 border border-[#e8e4de] rounded-lg py-2 px-3 text-sm text-[#2f2b27] focus:outline-none focus:border-[#d0ccc5]'
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                ) : (
                  <span
                    className='flex-1 text-sm text-[#2f2b27] cursor-pointer hover:text-[#4a4540]'
                    onClick={() => handleStartEdit(task)}
                    title='Click to edit'
                  >
                    {task.title}
                  </span>
                )}
                <button
                  type='button'
                  className='text-xs text-[#8b8680] bg-transparent border-none cursor-pointer hover:text-red-600'
                  onClick={() => handleRemoveTask(task.id)}
                >
                  Remove
                </button>
              </div>
            ))}

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
              className='w-full py-2.5 px-4 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-500 to-indigo-500 text-white cursor-pointer border-none transition-all duration-200 hover:from-purple-600 hover:to-indigo-600'
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
              ✨ Ask Marvin to draft tasks
            </button>
          </div>
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
