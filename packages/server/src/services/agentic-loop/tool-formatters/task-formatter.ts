import type { ToolResultFormatter } from './types.js'
import { ChorusFormatter } from './chorus-formatter.js'

export class TaskToolFormatter implements ToolResultFormatter {
  private readonly taskTools = [
    'create_task',
    'update_task',
    'move_task',
    'move_task_to_project',
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
      case 'move_task':
        return this.formatMoveTask(toolResult)
      case 'move_task_to_project':
        return this.formatMoveTaskToProject(toolResult)
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

  private formatCreateTask(result: any): string {
    return `Task created successfully: "${result.taskTitle}" on board "${result.boardName}" in column "${result.columnName}"${
      result.assigneeName ? ` (assigned to ${result.assigneeName})` : ''
    }. Task ID: ${ChorusFormatter.task(result.taskId)}`
  }

  private formatUpdateTask(result: any): string {
    let message = `Task updated successfully:\n• Task ID: ${ChorusFormatter.task(result.task?.id)}`
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

  private formatMoveTask(result: any): string {
    return `Task moved successfully:\n• Task ID: ${ChorusFormatter.task(result.task?.id)}\n• New column ID: ${result.task?.columnId}\n• Position: ${result.task?.position}`
  }

  private formatMoveTaskToProject(result: any): string {
    const projectIdFormatted = result.task?.projectId
      ? ChorusFormatter.project(result.task.projectId)
      : 'orphaned'
    return `Task moved to project:\n• Task ID: ${ChorusFormatter.task(result.task?.id)}\n• New project ID: ${projectIdFormatted}\n• New column ID: ${result.task?.columnId}\n• Position: ${result.task?.position}`
  }

  private formatArchiveTask(result: any): string {
    return `Task archived successfully:\n• Task ID: ${ChorusFormatter.task(result.task?.id)}`
  }

  private formatUnarchiveTask(result: any): string {
    return `Task unarchived successfully:\n• Task ID: ${ChorusFormatter.task(result.task?.id)}`
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
    const taskList =
      result.tasks
        ?.map(
          (t: any) =>
            `${t.title} (ID: ${ChorusFormatter.task(t.id)}) - Column: ${t.columnId}, Position: ${t.position}`
        )
        .join('\n• ') || 'No tasks found in project'
    return `Project tasks:\n• ${taskList}`
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
