import type { ToolResultFormatter } from './types.js'
import { DEFAULT_KANBAN_COLUMNS } from '@work-squared/shared'
import { ChorusFormatter } from './chorus-formatter.js'

export class ProjectToolFormatter implements ToolResultFormatter {
  private readonly projectTools = ['create_project', 'list_projects', 'get_project_details']

  canFormat(toolName: string): boolean {
    return this.projectTools.includes(toolName)
  }

  format(toolResult: any, toolCall: any): string {
    const toolName = toolCall.function.name

    switch (toolName) {
      case 'create_project':
        return this.formatCreateProject(toolResult)
      case 'list_projects':
        return this.formatListProjects(toolResult)
      case 'get_project_details':
        return this.formatGetProjectDetails(toolResult)
      default:
        return `Project operation completed: ${JSON.stringify(toolResult, null, 2)}`
    }
  }

  private formatCreateProject(result: any): string {
    if (!result.project) {
      return `Failed to create project: ${result.error || 'Unknown error'}`
    }
    const p = result.project
    const columnNames = DEFAULT_KANBAN_COLUMNS.map(col => `"${col.name}"`).join(', ')
    return `Project created successfully:\n• Name: ${p.name}\n• ID: ${ChorusFormatter.project(p.id)}${
      p.description ? `\n• Description: ${p.description}` : ''
    }\n• Default columns created: ${columnNames}`
  }

  private formatListProjects(result: any): string {
    const projectList =
      result.projects
        ?.map(
          (p: any) =>
            `${p.name} (ID: ${ChorusFormatter.project(p.id)})${p.description ? ` - ${p.description}` : ''}`
        )
        .join('\n• ') || 'No projects found'
    return `Available projects:\n• ${projectList}`
  }

  private formatGetProjectDetails(result: any): string {
    if (!result.project) {
      return 'Project not found'
    }
    const p = result.project
    return `Project details:\n• ID: ${ChorusFormatter.project(p.id)}\n• Name: ${p.name}\n• Description: ${
      p.description || 'none'
    }\n• Document count: ${p.documentCount}\n• Task count: ${p.taskCount}`
  }
}
