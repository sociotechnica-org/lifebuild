import type { ToolResultFormatter } from './types.js'

export class WorkerToolFormatter implements ToolResultFormatter {
  private readonly workerTools = [
    'create_worker',
    'update_worker',
    'list_workers',
    'get_worker',
    'deactivate_worker',
    'assign_worker_to_project',
    'unassign_worker_from_project',
    'get_project_workers',
    'get_worker_projects',
  ]

  canFormat(toolName: string): boolean {
    return this.workerTools.includes(toolName)
  }

  format(toolResult: any, toolCall: any): string {
    const toolName = toolCall.function.name

    switch (toolName) {
      case 'create_worker':
        return this.formatCreateWorker(toolResult)
      case 'update_worker':
        return this.formatUpdateWorker(toolResult)
      case 'list_workers':
        return this.formatListWorkers(toolResult)
      case 'get_worker':
        return this.formatGetWorker(toolResult)
      case 'deactivate_worker':
        return this.formatDeactivateWorker(toolResult)
      case 'assign_worker_to_project':
        return this.formatAssignWorkerToProject(toolResult)
      case 'unassign_worker_from_project':
        return this.formatUnassignWorkerFromProject(toolResult)
      case 'get_project_workers':
        return this.formatGetProjectWorkers(toolResult)
      case 'get_worker_projects':
        return this.formatGetWorkerProjects(toolResult)
      default:
        return `Worker operation completed: ${JSON.stringify(toolResult, null, 2)}`
    }
  }

  private formatCreateWorker(result: any): string {
    if (!result.worker) {
      return `Failed to create worker: ${result.error || 'Unknown error'}`
    }

    const worker = result.worker
    return [
      `✅ **Worker created successfully!**`,
      '',
      `**Name:** ${worker.name}`,
      `**ID:** \`${worker.id}\``,
      `**Default Model:** ${worker.defaultModel}`,
      worker.roleDescription ? `**Role:** ${worker.roleDescription}` : '',
      `**System Prompt:** ${this.truncatePrompt(worker.systemPrompt)}`,
      worker.avatar ? `**Avatar:** ${worker.avatar}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  private formatUpdateWorker(result: any): string {
    if (!result.worker) {
      return `Failed to update worker: ${result.error || 'Unknown error'}`
    }

    const worker = result.worker
    const updates = Object.keys(worker).filter(key => key !== 'id')

    return [
      `✅ **Worker updated successfully!**`,
      '',
      `**Worker ID:** \`${worker.id}\``,
      `**Updated fields:** ${updates.join(', ')}`,
    ].join('\n')
  }

  private formatListWorkers(result: any): string {
    if (!result.workers || result.workers.length === 0) {
      return 'No workers found.'
    }

    const workers = result.workers
    const header = `Found ${workers.length} worker${workers.length === 1 ? '' : 's'}:\n`

    const workerList = workers
      .map((worker: any, index: number) => {
        const status = worker.isActive ? '🟢 Active' : '🔴 Inactive'
        const role = worker.roleDescription ? ` - ${worker.roleDescription}` : ''
        return `${index + 1}. **${worker.name}**${role}\n   ${status} | Model: ${worker.defaultModel} | ID: \`${worker.id}\``
      })
      .join('\n\n')

    return header + '\n' + workerList
  }

  private formatGetWorker(result: any): string {
    if (!result.worker) {
      return `Worker not found: ${result.error || 'Unknown error'}`
    }

    const worker = result.worker
    const projects = worker.projects || []

    return [
      `## ${worker.name}`,
      '',
      `**Status:** ${worker.isActive ? '🟢 Active' : '🔴 Inactive'}`,
      `**ID:** \`${worker.id}\``,
      `**Default Model:** ${worker.defaultModel}`,
      worker.roleDescription ? `**Role:** ${worker.roleDescription}` : '',
      worker.avatar ? `**Avatar:** ${worker.avatar}` : '',
      `**Created:** ${new Date(worker.createdAt).toLocaleDateString()}`,
      worker.updatedAt
        ? `**Last Updated:** ${new Date(worker.updatedAt).toLocaleDateString()}`
        : '',
      '',
      `**System Prompt:**\n\`\`\`\n${worker.systemPrompt}\n\`\`\``,
      '',
      projects.length > 0
        ? `**Assigned Projects (${projects.length}):**\n${projects.map((p: any) => `- ${p.name} (\`${p.id}\`)`).join('\n')}`
        : '**No projects assigned**',
    ]
      .filter(Boolean)
      .join('\n')
  }

  private formatDeactivateWorker(result: any): string {
    if (!result.success) {
      return `Failed to deactivate worker: ${result.error || 'Unknown error'}`
    }

    return `🔴 ${result.message || 'Worker deactivated successfully'}`
  }

  private formatAssignWorkerToProject(result: any): string {
    if (!result.success) {
      return `Failed to assign worker to project: ${result.error || 'Unknown error'}`
    }

    return `✅ ${result.message || 'Worker assigned to project successfully'}`
  }

  private formatUnassignWorkerFromProject(result: any): string {
    if (!result.success) {
      return `Failed to unassign worker from project: ${result.error || 'Unknown error'}`
    }

    return `⚡ ${result.message || 'Worker unassigned from project successfully'}`
  }

  private formatGetProjectWorkers(result: any): string {
    if (!result.workers || result.workers.length === 0) {
      return `No workers assigned to this project.`
    }

    const workers = result.workers
    const header = `**Workers assigned to project (${workers.length}):**\n`

    const workerList = workers
      .map((worker: any, index: number) => {
        const status = worker.isActive ? '🟢' : '🔴'
        const role = worker.roleDescription ? ` - ${worker.roleDescription}` : ''
        return `${index + 1}. ${status} **${worker.name}**${role}\n   Model: ${worker.defaultModel} | ID: \`${worker.id}\``
      })
      .join('\n\n')

    return header + '\n' + workerList
  }

  private formatGetWorkerProjects(result: any): string {
    if (!result.projects || result.projects.length === 0) {
      const workerName = result.worker?.name || 'Worker'
      return `${workerName} is not assigned to any projects.`
    }

    const { worker, projects } = result
    const header = `**Projects assigned to ${worker?.name || 'worker'} (${projects.length}):**\n`

    const projectList = projects
      .map((project: any, index: number) => {
        const description = project.description ? `\n   ${project.description}` : ''
        return `${index + 1}. **${project.name}**${description}\n   ID: \`${project.id}\``
      })
      .join('\n\n')

    return header + '\n' + projectList
  }

  private truncatePrompt(prompt: string, maxLength: number = 100): string {
    if (prompt.length <= maxLength) {
      return prompt
    }
    return prompt.substring(0, maxLength) + '...'
  }
}
