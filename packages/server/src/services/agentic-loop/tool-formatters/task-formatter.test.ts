import { describe, expect, it } from 'vitest'

import { TaskToolFormatter } from './task-formatter.js'

const createTaskToolCall = { function: { name: 'create_task' } }

describe('TaskToolFormatter', () => {
  it('includes the provided project name in create_task output', () => {
    const formatter = new TaskToolFormatter()
    const resultMessage = formatter.format(
      {
        success: true,
        taskTitle: 'Spin up test environment',
        projectName: "Danvers' Game of LifeSquared",
        columnName: 'To Do',
        taskId: 'task-123',
      },
      createTaskToolCall
    )

    expect(resultMessage).toContain(`in project "Danvers' Game of LifeSquared"`)
    expect(resultMessage).toContain('<CHORUS_TAG path="task:task-123">task-123</CHORUS_TAG>')
  })

  it('uses project name when provided', () => {
    const formatter = new TaskToolFormatter()
    const resultMessage = formatter.format(
      {
        success: true,
        taskTitle: 'Write onboarding checklist',
        projectName: 'LifeSquared Launch',
        columnName: 'In Progress',
        taskId: 'task-456',
      },
      createTaskToolCall
    )

    expect(resultMessage).toContain('in project "LifeSquared Launch"')
  })

  it('surfaces task creation errors directly', () => {
    const formatter = new TaskToolFormatter()
    const resultMessage = formatter.format(
      {
        success: false,
        error: 'Project with ID project-123 not found',
      },
      createTaskToolCall
    )

    expect(resultMessage).toBe('Task creation failed: Project with ID project-123 not found')
  })
})
