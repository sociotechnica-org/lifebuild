import React from 'react'
import { useQuery, useStore } from '@livestore/react'
import { getProjects$ } from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { calculateNextExecution } from '@work-squared/shared'
import { RecurringTaskFormPresentation } from './RecurringTaskFormPresentation.js'

interface RecurringTaskFormProps {
  isOpen: boolean
  onClose: () => void
  projectId?: string | null
}

export const RecurringTaskForm: React.FC<RecurringTaskFormProps> = ({
  isOpen,
  onClose,
  projectId = null,
}) => {
  const { store } = useStore()
  const projects = useQuery(getProjects$) ?? []

  const handleSubmit = (data: {
    name: string
    description: string
    prompt: string
    intervalHours: number
    assigneeIds: string[]
    projectId: string | null
  }) => {
    const now = new Date()
    const nextExecutionAt = new Date(calculateNextExecution(now.getTime(), data.intervalHours))

    store.commit(
      events.recurringTaskCreated({
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description || undefined,
        prompt: data.prompt,
        intervalHours: data.intervalHours,
        assigneeIds: data.assigneeIds.length > 0 ? data.assigneeIds : undefined,
        enabled: true,
        projectId: data.projectId || undefined,
        nextExecutionAt,
        createdAt: now,
      })
    )
  }

  return (
    <RecurringTaskFormPresentation
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      projects={projects}
      projectId={projectId}
    />
  )
}
