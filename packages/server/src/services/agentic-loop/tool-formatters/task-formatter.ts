import type { ToolResultFormatter } from './types.js'
import { ChorusFormatter } from './chorus-formatter.js'

// Formatter contract interfaces to ensure tool results match formatter expectations
export interface TaskFormatterResult {
  success: boolean
  error?: string
  taskId?: string
  taskTitle?: string
  projectName?: string
  columnName?: string
  assigneeNames?: string[]
  task?: {
    id: string
    title?: string
    description?: string
    projectId?: string
    columnId?: string
    position?: number
    assigneeIds?: string[]
    archivedAt?: Date | null
  }
  tasks?: Array<{
    id: string
    title: string
    columnId: string
    position: number
  }>
}

export class TaskToolFormatter implements ToolResultFormatter {
  private readonly taskTools = [
    'create_task',
    'update_task',
    'move_task_within_project',
    'move_task_to_project',
    'orphan_task',
    'archive_task',
    'unarchive_task',
    'get_task_by_id',
    'get_project_tasks',
    'get_orphaned_tasks',
  ]

  canFormat(toolName: string): boolean {
    return this.taskTools.includes(toolName)
  }

  format(toolResult: any, toolCall: any): string {
    const toolName = toolCall.function.name

    switch (toolName) {
      case 'create_task':
        return this.formatCreateTask(toolResult)
      case 'update_task':
        return this.formatUpdateTask(toolResult)
      case 'move_task_within_project':
        return this.formatMoveTaskWithinProject(toolResult)
      case 'move_task_to_project':
        return this.formatMoveTaskToProject(toolResult)
      case 'orphan_task':
        return this.formatOrphanTask(toolResult)
      case 'archive_task':
        return this.formatArchiveTask(toolResult)
      case 'unarchive_task':
        return this.formatUnarchiveTask(toolResult)
      case 'get_task_by_id':
        return this.formatGetTaskById(toolResult)
      case 'get_project_tasks':
        return this.formatGetProjectTasks(toolResult)
      case 'get_orphaned_tasks':
        return this.formatGetOrphanedTasks(toolResult)
      default:
        return `Task operation completed: ${JSON.stringify(toolResult, null, 2)}`
    }
  }

  private formatCreateTask(result: TaskFormatterResult): string {
    if (result?.success === false) {
      const errorMessage = result?.error ?? 'Unknown error occurred'
      return `Task creation failed: ${errorMessage}`
    }

    const taskTitle = result?.taskTitle ?? 'Untitled task'
    const projectName = result?.projectName ?? 'unknown project'
    const columnName = result?.columnName ?? 'unknown column'
    const assigneeSuffix = result?.assigneeNames?.length
      ? ` (assigned to ${result.assigneeNames.join(', ')})`
      : ''
    const taskId = result?.taskId ? ChorusFormatter.task(result.taskId) : 'unavailable'

    return `Task created successfully: "${taskTitle}" in project "${projectName}" column "${columnName}"${assigneeSuffix}. Task ID: ${taskId}`
  }

  private formatUpdateTask(result: any): string {
    if (!result.task?.id) {
      return 'Task update failed: Task ID not found'
    }
    let message = `Task updated successfully:\n• Task ID: ${ChorusFormatter.task(result.task.id)}`
    if (result.task?.title) {
      message += `\n• New title: ${result.task.title}`
    }
    if (result.task?.description !== undefined) {
      message += `\n• Description updated`
    }
    if (result.task?.assigneeIds) {
      message += `\n• Assignees updated`
    }
    return message
  }

  private formatMoveTaskWithinProject(result: any): string {
    if (!result.task?.id) {
      return 'Task move failed: Task ID not found'
    }
    return `Task moved within project successfully:\n• Task ID: ${ChorusFormatter.task(result.task.id)}\n• New column ID: ${result.task.columnId}\n• Position: ${result.task.position}`
  }

  private formatMoveTaskToProject(result: any): string {
    if (!result.task?.id) {
      return 'Task move to project failed: Task ID not found'
    }
    return `Task moved to project:\n• Task ID: ${ChorusFormatter.task(result.task.id)}\n• New project ID: ${ChorusFormatter.project(result.task.projectId)}\n• New column ID: ${result.task.columnId}\n• Position: ${result.task.position}`
  }

  private formatOrphanTask(result: any): string {
    if (!result.task?.id) {
      return 'Task orphaning failed: Task ID not found'
    }
    return `Task orphaned successfully:\n• Task ID: ${ChorusFormatter.task(result.task.id)}\n• Orphaned column ID: ${result.task.columnId}\n• Position: ${result.task.position}`
  }

  private formatArchiveTask(result: any): string {
    if (!result.task?.id) {
      return 'Task archive failed: Task ID not found'
    }
    return `Task archived successfully:\n• Task ID: ${ChorusFormatter.task(result.task.id)}`
  }

  private formatUnarchiveTask(result: any): string {
    if (!result.task?.id) {
      return 'Task unarchive failed: Task ID not found'
    }
    return `Task unarchived successfully:\n• Task ID: ${ChorusFormatter.task(result.task.id)}`
  }

  private formatGetTaskById(result: any): string {
    if (!result.task) {
      return 'Task not found'
    }
    const t = result.task
    let message = `Task details:\n• ID: ${ChorusFormatter.task(t.id)}\n• Title: ${t.title}\n• Project ID: ${
      t.projectId ? ChorusFormatter.project(t.projectId) : 'none'
    }\n• Column ID: ${t.columnId || 'none'}\n• Description: ${
      t.description || 'none'
    }\n• Position: ${t.position}`
    if (t.assigneeIds?.length) {
      message += `\n• Assignees: ${t.assigneeIds.join(', ')}`
    }
    return message
  }

  private formatGetProjectTasks(result: any): string {
    const projectInfo = result.projectName ? ` for "${result.projectName}"` : ''
    const taskList =
      result.tasks
        ?.map(
          (t: any) =>
            `${t.title} (ID: ${ChorusFormatter.task(t.id)}) - Column: ${t.columnName || t.columnId}, Position: ${t.position}`
        )
        .join('\n• ') || 'No tasks found in project'
    return `Project tasks${projectInfo}:\n• ${taskList}`
  }

  private formatGetOrphanedTasks(result: any): string {
    const taskList =
      result.tasks
        ?.map(
          (t: any) => `${t.title} (ID: ${ChorusFormatter.task(t.id)}) - Position: ${t.position}`
        )
        .join('\n• ') || 'No orphaned tasks found'
    return `Orphaned tasks:\n• ${taskList}`
  }
}
