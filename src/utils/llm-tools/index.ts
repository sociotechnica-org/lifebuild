import type { Store } from '@livestore/livestore'

// Export base types and utilities
export * from './base.js'

// Export task tools and types
export * from './tasks.js'

// Export project tools
export * from './projects.js'

// Export document tools
export * from './documents.js'

/**
 * Execute an LLM tool call
 */
export async function executeLLMTool(
  store: Store,
  toolCall: { name: string; parameters: any }
): Promise<any> {
  // Import functions dynamically to avoid circular dependencies
  const {
    createTask,
    updateTask,
    moveTask,
    moveTaskToProject,
    archiveTask,
    unarchiveTask,
    getTaskById,
    getProjectTasks,
    getOrphanedTasks,
  } = await import('./tasks.js')

  const { listProjects, getProjectDetails } = await import('./projects.js')

  const {
    listDocuments,
    readDocument,
    searchDocuments,
    getProjectDocuments,
    searchProjectDocuments,
  } = await import('./documents.js')

  switch (toolCall.name) {
    case 'create_task':
      return createTask(store, toolCall.parameters)

    case 'update_task':
      return updateTask(store, toolCall.parameters)

    case 'move_task':
      return moveTask(store, toolCall.parameters)

    case 'move_task_to_project':
      return moveTaskToProject(store, toolCall.parameters)

    case 'archive_task':
      return archiveTask(store, toolCall.parameters.taskId)

    case 'unarchive_task':
      return unarchiveTask(store, toolCall.parameters.taskId)

    case 'get_task_by_id':
      return getTaskById(store, toolCall.parameters.taskId)

    case 'get_project_tasks':
      return getProjectTasks(store, toolCall.parameters.projectId)

    case 'get_orphaned_tasks':
      return getOrphanedTasks(store)

    case 'list_projects':
      return listProjects(store)

    case 'list_documents':
      return listDocuments(store)

    case 'read_document':
      return readDocument(store, toolCall.parameters.documentId)

    case 'search_documents':
      return searchDocuments(store, toolCall.parameters.query)

    case 'get_project_documents':
      return getProjectDocuments(store, toolCall.parameters.projectId)

    case 'search_project_documents':
      return searchProjectDocuments(store, toolCall.parameters.query, toolCall.parameters.projectId)

    case 'get_project_details':
      return getProjectDetails(store, toolCall.parameters.projectId)

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`)
  }
}
