import type { Store } from '@livestore/livestore'

// Export base types and utilities
export * from './base.js'

// Export task tools and types
export * from './tasks.js'

// Export project tools
export * from './projects.js'

// Export document tools
export * from './documents.js'

// Export contact tools
export * from './contacts.js'

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

  const { createProject, listProjects, getProjectDetails } = await import('./projects.js')

  const {
    listDocuments,
    readDocument,
    searchDocuments,
    getProjectDocuments,
    searchProjectDocuments,
    createDocument,
    updateDocument,
    archiveDocument,
    addDocumentToProject,
    removeDocumentFromProject,
  } = await import('./documents.js')

  const {
    listContacts,
    getContact,
    searchContacts,
    createContact,
    updateContact,
    deleteContact,
    getProjectContacts,
    getContactProjects,
    addContactToProject,
    removeContactFromProject,
    getProjectEmailList,
    findContactsByEmail,
    getProjectContactEmails,
    validateEmailList,
    suggestContactsFromEmails,
  } = await import('./contacts.js')

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

    case 'create_project':
      return createProject(store, toolCall.parameters)

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

    case 'create_document':
      return createDocument(store, toolCall.parameters)

    case 'update_document':
      return updateDocument(store, toolCall.parameters)

    case 'archive_document':
      return archiveDocument(store, toolCall.parameters.documentId)

    case 'add_document_to_project':
      return addDocumentToProject(store, toolCall.parameters)

    case 'remove_document_from_project':
      return removeDocumentFromProject(store, toolCall.parameters)

    // Contact tools
    case 'list_contacts':
      return listContacts(store)

    case 'get_contact':
      return getContact(store, toolCall.parameters.contactId)

    case 'search_contacts':
      return searchContacts(store, toolCall.parameters.query)

    case 'create_contact':
      return createContact(store, toolCall.parameters)

    case 'update_contact':
      return updateContact(store, toolCall.parameters)

    case 'delete_contact':
      return deleteContact(store, toolCall.parameters.contactId)

    case 'get_project_contacts':
      return getProjectContacts(store, toolCall.parameters.projectId)

    case 'get_contact_projects':
      return getContactProjects(store, toolCall.parameters.contactId)

    case 'add_contact_to_project':
      return addContactToProject(store, toolCall.parameters)

    case 'remove_contact_from_project':
      return removeContactFromProject(store, toolCall.parameters)

    case 'get_project_email_list':
      return getProjectEmailList(store, toolCall.parameters.projectId)

    case 'find_contacts_by_email':
      return findContactsByEmail(store, toolCall.parameters)

    case 'get_project_contact_emails':
      return getProjectContactEmails(store, toolCall.parameters.projectId)

    case 'validate_email_list':
      return validateEmailList(store, toolCall.parameters)

    case 'suggest_contacts_from_emails':
      return suggestContactsFromEmails(store, toolCall.parameters)

    default:
      throw new Error(`Unknown tool: ${toolCall.name}`)
  }
}
