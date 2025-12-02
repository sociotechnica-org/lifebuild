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
import './stage-form.css'

export const Stage3Form: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { store } = useStore()
  const { user } = useAuth()

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
    navigate(generateRoute.newDraftingRoom())
  }

  const handleContinue = () => {
    if (!hasAtLeastOneTask) return
    saveAndAdvance()
    // Project moves to backlog, navigate to Sorting Room
    navigate(generateRoute.newSortingRoom())
  }

  if (!project) {
    return (
      <div className='stage-form'>
        <div className='stage-form-card'>
          <p>Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className='stage-form'>
      <div className='stage-form-card stage-form-card-wide'>
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
          <div className='stage-form-project-header'>
            <div className='stage-form-project-title'>{project.name || 'Untitled Project'}</div>
            {project.category && getCategoryInfo(project.category as ProjectCategory) && (
              <span
                className='stage-form-category-badge'
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
        <div className='stage-form-header'>
          <h1 className='stage-form-title'>Stage 3: Drafting</h1>
          <p className='stage-form-subtitle'>Create actionable task list - 30 minutes</p>
        </div>

        {/* Task List */}
        <div className='stage-form-fields'>
          <div className='stage-form-task-list'>
            {tasks.map(task => (
              <div key={task.id} className='stage-form-task-item'>
                {editingTaskId === task.id ? (
                  <input
                    type='text'
                    className='stage-form-task-edit-input'
                    value={editingTitle}
                    onChange={e => setEditingTitle(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={handleEditKeyDown}
                    autoFocus
                  />
                ) : (
                  <span
                    className='stage-form-task-title'
                    onClick={() => handleStartEdit(task)}
                    title='Click to edit'
                  >
                    {task.title}
                  </span>
                )}
                <button
                  type='button'
                  className='stage-form-task-remove-btn'
                  onClick={() => handleRemoveTask(task.id)}
                >
                  Remove
                </button>
              </div>
            ))}

            {/* Add new task input */}
            <div className='stage-form-task-add'>
              <input
                type='text'
                className='stage-form-task-add-input'
                placeholder='Add a new task...'
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyDown={handleNewTaskKeyDown}
              />
              <button
                type='button'
                className='stage-form-task-add-btn'
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='stage-form-actions'>
          <button type='button' className='stage-form-btn secondary' onClick={handleExit}>
            Save & Exit
          </button>
          <button
            type='button'
            className='stage-form-btn primary'
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
