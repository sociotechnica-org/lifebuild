import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@livestore/react'
import {
  getProjectById$,
  getProjectTasks$,
  getUsers$,
  getTaskComments$,
} from '@work-squared/shared/queries'
import type { Project, Task, User } from '@work-squared/shared/schema'
import { ROUTES } from '../../../constants/routes.js'
import { preserveStoreIdInUrl } from '../../../utils/navigation.js'
import styles from './KanbanRoom.module.css'

const parseAssigneeIds = (raw: string | null | undefined): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

type UsersById = Map<string, User>

// Audio player hook for ambient sounds
const useAmbientAudio = () => {
  const playSound = useCallback((type: 'drag' | 'drop' | 'hover') => {
    // Web Audio API for subtle ceramic/wood sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    if (type === 'drag') {
      oscillator.frequency.value = 220
      gainNode.gain.setValueAtTime(0.01, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } else if (type === 'drop') {
      oscillator.frequency.value = 180
      gainNode.gain.setValueAtTime(0.02, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.2)
    } else if (type === 'hover') {
      oscillator.frequency.value = 280
      gainNode.gain.setValueAtTime(0.005, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05)
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.05)
    }
  }, [])

  return { playSound }
}

// Ripple effect component
const Ripple: React.FC<{ x: number; y: number; onComplete: () => void }> = ({
  x,
  y,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      className={styles.ripple}
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    />
  )
}

// Zellige Card Component
interface TaskCardProps {
  task: Task
  usersById: UsersById
  onCardClick: (task: Task) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragEnd: () => void
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  usersById,
  onCardClick,
  onDragStart,
  onDragEnd,
}) => {
  const comments = useQuery(getTaskComments$(task.id)) ?? []
  const assigneeIds = parseAssigneeIds(task.assigneeIds ?? null)
  const assignees = assigneeIds
    .map(id => usersById.get(id))
    .filter((user): user is User => Boolean(user))
  const hasDescription = Boolean(task.description && task.description.trim().length > 0)
  const hasComments = comments.length > 0
  const { playSound } = useAmbientAudio()

  return (
    <div
      className={styles.card}
      draggable
      onDragStart={e => {
        onDragStart(e, task)
        playSound('drag')
      }}
      onDragEnd={() => {
        onDragEnd()
        playSound('drop')
      }}
      onClick={() => onCardClick(task)}
      onMouseEnter={() => playSound('hover')}
    >
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{task.title || 'Untitled task'}</h3>

        {hasDescription && task.description && (
          <p className={styles.cardDescription}>{task.description}</p>
        )}

        {assignees.length > 0 && (
          <div className={styles.cardAssignees}>
            {assignees.slice(0, 3).map(user => (
              <div
                key={user.id}
                className={styles.assigneeBubble}
                title={user.name || user.email || undefined}
              >
                {((user.name || user.email || '?')[0] ?? '?').toUpperCase()}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className={styles.assigneeBubble} title={`+${assignees.length - 3} more`}>
                +{assignees.length - 3}
              </div>
            )}
          </div>
        )}

        <div className={styles.cardMeta}>
          {hasComments && (
            <span className={styles.cardIcons} title={`${comments.length} comments`}>
              💬 {comments.length}
            </span>
          )}
          {hasDescription && <span className={styles.cardIcons}>📝</span>}
        </div>
      </div>
    </div>
  )
}

// Wooden Shelf Component
interface ShelfProps {
  title: string
  tasks: Task[]
  usersById: UsersById
  onCardClick: (task: Task) => void
  onDrop: (taskId: string) => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragEnd: () => void
}

const Shelf: React.FC<ShelfProps> = ({
  title,
  tasks,
  usersById,
  onCardClick,
  onDrop,
  onDragStart,
  onDragEnd,
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([])
  const shelfRef = useRef<HTMLDivElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const taskId = e.dataTransfer.getData('taskId')
      if (taskId) {
        onDrop(taskId)

        // Create ripple at drop position
        if (shelfRef.current) {
          const rect = shelfRef.current.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const rippleId = Date.now()
          setRipples(prev => [...prev, { id: rippleId, x, y }])
        }
      }
    },
    [onDrop]
  )

  const removeRipple = useCallback((id: number) => {
    setRipples(prev => prev.filter(r => r.id !== id))
  }, [])

  return (
    <div
      ref={shelfRef}
      className={styles.shelf}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className={styles.shelfHeader}>{title}</div>
      <div className={styles.cardsContainer}>
        {tasks.length === 0 ? (
          <div className={styles.emptyShelf}>empty shelf, awaiting work</div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              usersById={usersById}
              onCardClick={onCardClick}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
      {ripples.map(ripple => (
        <Ripple
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          onComplete={() => removeRipple(ripple.id)}
        />
      ))}
    </div>
  )
}

// Modal Component - Rice Paper
interface ModalProps {
  task: Task
  usersById: UsersById
  onClose: () => void
}

const TaskModal: React.FC<ModalProps> = ({ task, usersById, onClose }) => {
  const comments = useQuery(getTaskComments$(task.id)) ?? []
  const assigneeIds = parseAssigneeIds(task.assigneeIds ?? null)
  const assignees = assigneeIds
    .map(id => usersById.get(id))
    .filter((user): user is User => Boolean(user))

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  return (
    <div className={styles.modal}>
      <div className={styles.modalBackdrop} onClick={onClose} />
      <div className={styles.modalContent}>
        <button className={styles.modalClose} onClick={onClose} aria-label='Close'>
          ×
        </button>
        <h2 className={styles.modalTitle}>{task.title || 'Untitled task'}</h2>
        <div className={styles.modalBody}>
          <p>
            <strong>Status:</strong> {task.status}
          </p>
          {task.description && (
            <>
              <h3>Description</h3>
              <p>{task.description}</p>
            </>
          )}
          {assignees.length > 0 && (
            <>
              <h3>Assigned to</h3>
              <ul>
                {assignees.map(user => (
                  <li key={user.id}>{user.name || user.email || user.id}</li>
                ))}
              </ul>
            </>
          )}
          {comments.length > 0 && (
            <>
              <h3>Comments ({comments.length})</h3>
              <ul>
                {comments.map(comment => (
                  <li key={comment.id}>{comment.content}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Main Kanban Room Component
export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const resolvedProjectId = projectId ?? '__invalid__'
  const projectRows = useQuery(getProjectById$(resolvedProjectId)) ?? []
  const tasks = useQuery(getProjectTasks$(resolvedProjectId)) ?? []
  const users = useQuery(getUsers$) ?? []
  const usersById = useMemo(() => new Map(users.map(user => [user.id, user])), [users])
  const project = (projectRows[0] ?? undefined) as Project | undefined

  // Cursor tracking for lighting effect
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 })

  // Modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const groups: Record<string, Task[]> = {
      todo: [],
      doing: [],
      'in review': [],
      done: [],
    }
    tasks.forEach(task => {
      const status = task.status?.toLowerCase() || 'todo'
      if (groups[status]) {
        groups[status]!.push(task)
      } else {
        groups.todo!.push(task)
      }
    })
    return groups
  }, [tasks])

  // Update cursor and light position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY })

      // Light follows with slight delay
      setLightPos({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
  }, [])

  const handleDragEnd = useCallback(() => {
    // Drag ended
  }, [])

  const handleDrop = useCallback(
    (newStatus: string) => (taskId: string) => {
      // TODO: Implement task status update via LiveStore mutation
      // For now, this is a visual-only demo
      console.log(`Moving task ${taskId} to ${newStatus}`)
      // store.mutate([{ type: 'task.statusChanged', taskId, status: newStatus }])
    },
    []
  )

  if (!projectId) {
    return <div className={styles.kanbanRoom}>Invalid project ID</div>
  }

  if (!project) {
    return (
      <div className={styles.kanbanRoom}>
        <div style={{ padding: '2rem', color: 'var(--kr-paper)' }}>
          <Link
            to={preserveStoreIdInUrl(ROUTES.NEW_PROJECTS)}
            style={{ color: 'var(--kr-terracotta)' }}
          >
            ← Back to projects
          </Link>
          <h1>Project not found</h1>
          <p>The requested project ({projectId}) does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.kanbanRoom} ${styles.aged}`}>
      {/* Custom cursor */}
      <div className={styles.cursor} style={{ left: cursorPos.x, top: cursorPos.y }}>
        <div className={styles.cursorCore} />
      </div>

      {/* Lighting layer that follows cursor */}
      <div className={styles.lightingLayer}>
        <div
          className={styles.lightSpot}
          style={{ left: `${lightPos.x}%`, top: `${lightPos.y}%` }}
        />
      </div>

      {/* Bamboo shadows */}
      <div className={styles.bambooShadows} />

      {/* Back navigation */}
      <div style={{ padding: '2rem 3rem', position: 'relative', zIndex: 10 }}>
        <Link
          to={preserveStoreIdInUrl(ROUTES.NEW_PROJECTS)}
          style={{
            color: 'var(--kr-terracotta)',
            textDecoration: 'none',
            fontSize: '14px',
            opacity: 0.8,
          }}
        >
          ← back to projects
        </Link>
      </div>

      {/* Project header */}
      <header style={{ padding: '0 3rem 2rem', position: 'relative', zIndex: 10 }}>
        <h1
          style={{
            color: 'var(--kr-paper)',
            fontSize: '32px',
            fontWeight: 300,
            margin: '0 0 0.5rem 0',
          }}
        >
          {project.name || 'Untitled project'}
        </h1>
        {project.description && (
          <p style={{ color: 'var(--kr-paper)', opacity: 0.7, fontSize: '16px', margin: 0 }}>
            {project.description}
          </p>
        )}
      </header>

      {/* Shelves container */}
      <div className={styles.shelvesContainer}>
        <Shelf
          title='to do'
          tasks={tasksByStatus.todo ?? []}
          usersById={usersById}
          onCardClick={setSelectedTask}
          onDrop={handleDrop('todo')}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
        <Shelf
          title='doing'
          tasks={tasksByStatus.doing ?? []}
          usersById={usersById}
          onCardClick={setSelectedTask}
          onDrop={handleDrop('doing')}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
        <Shelf
          title='in review'
          tasks={tasksByStatus['in review'] ?? []}
          usersById={usersById}
          onCardClick={setSelectedTask}
          onDrop={handleDrop('in review')}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
        <Shelf
          title='done'
          tasks={tasksByStatus.done ?? []}
          usersById={usersById}
          onCardClick={setSelectedTask}
          onDrop={handleDrop('done')}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          usersById={usersById}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}
