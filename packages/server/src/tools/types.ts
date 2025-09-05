/**
 * TypeScript interfaces for LLM tool parameters and results
 * Provides compile-time type safety and better IDE support
 */

// ===== TASK TOOL TYPES =====

export interface CreateTaskParams {
  title: string
  description?: string
  boardId?: string
  columnId?: string
  assigneeId?: string
}

export interface CreateTaskResult {
  success: boolean
  taskId?: string
  error?: string
  taskTitle?: string
  projectName?: string
  columnName?: string
  assigneeName?: string
}

export interface UpdateTaskParams {
  taskId: string
  title?: string
  description?: string
  assigneeIds?: string[]
}

export interface UpdateTaskResult {
  success: boolean
  error?: string
  task?: {
    id: string
    title?: string
    description?: string
    assigneeIds?: string[]
  }
}

export interface MoveTaskParams {
  taskId: string
  toColumnId: string
  position?: number
}

export interface MoveTaskResult {
  success: boolean
  error?: string
  task?: {
    id: string
    columnId: string
    position: number
  }
}

export interface MoveTaskToProjectParams {
  taskId: string
  toProjectId?: string
  toColumnId: string
  position?: number
}

export interface MoveTaskToProjectResult {
  success: boolean
  error?: string
  task?: {
    id: string
    projectId?: string
    columnId: string
    position: number
  }
}

export interface ArchiveTaskParams {
  taskId: string
}

export interface ArchiveTaskResult {
  success: boolean
  error?: string
  task?: {
    id: string
    archivedAt: Date
  }
}

export interface UnarchiveTaskParams {
  taskId: string
}

export interface UnarchiveTaskResult {
  success: boolean
  error?: string
  task?: {
    id: string
    archivedAt: null
  }
}

export interface GetTaskByIdParams {
  taskId: string
}

export interface GetTaskByIdResult {
  success: boolean
  task?: {
    id: string
    projectId?: string
    columnId?: string
    title: string
    description?: string
    assigneeIds?: string[]
    position: number
    createdAt: Date
    archivedAt?: Date
  }
  error?: string
}

export interface GetProjectTasksParams {
  projectId: string
}

export interface GetProjectTasksResult {
  success: boolean
  tasks?: Array<{
    id: string
    projectId: string
    columnId: string
    title: string
    description?: string
    assigneeIds?: string[]
    position: number
    createdAt: Date
  }>
  error?: string
}

export interface GetOrphanedTasksParams {
  // No parameters needed
}

export interface GetOrphanedTasksResult {
  success: boolean
  tasks?: Array<{
    id: string
    projectId?: string
    columnId?: string
    title: string
    description?: string
    assigneeIds?: string[]
    position: number
    createdAt: Date
  }>
  error?: string
}

// ===== PROJECT TOOL TYPES =====

export interface CreateProjectParams {
  name: string
  description?: string
}

export interface CreateProjectResult {
  success: boolean
  project?: {
    id: string
    name: string
    description?: string
    createdAt: Date
  }
  error?: string
}

export interface ListProjectsParams {
  // No parameters needed
}

export interface ListProjectsResult {
  success: boolean
  projects?: Array<{
    id: string
    name: string
    description?: string
    createdAt: Date
  }>
  error?: string
}

export interface GetProjectDetailsParams {
  projectId: string
}

export interface GetProjectDetailsResult {
  success: boolean
  project?: {
    id: string
    name: string
    description?: string
    createdAt: Date
    updatedAt?: Date
    documentCount: number
    taskCount: number
  }
  error?: string
}

// ===== DOCUMENT TOOL TYPES =====

export interface ListDocumentsParams {
  // No parameters needed
}

export interface ListDocumentsResult {
  success: boolean
  documents?: Array<{
    id: string
    title: string
    updatedAt: Date
  }>
  error?: string
}

export interface ReadDocumentParams {
  documentId: string
}

export interface ReadDocumentResult {
  success: boolean
  document?: {
    id: string
    title: string
    content: string
    createdAt: Date
    updatedAt: Date
  }
  error?: string
}

export interface SearchDocumentsParams {
  query: string
}

export interface SearchDocumentsResult {
  success: boolean
  results?: Array<{
    id: string
    title: string
    snippet: string
  }>
  error?: string
}

export interface GetProjectDocumentsParams {
  projectId: string
}

export interface GetProjectDocumentsResult {
  success: boolean
  documents?: Array<{
    id: string
    title: string
    content: string
    updatedAt: Date
    createdAt: Date
  }>
  error?: string
}

export interface SearchProjectDocumentsParams {
  query: string
  projectId?: string
}

export interface SearchProjectDocumentsResult {
  success: boolean
  results?: Array<{
    id: string
    title: string
    snippet: string
    projectId?: string
  }>
  error?: string
}

// ===== NEW DOCUMENT TOOL TYPES =====

export interface CreateDocumentParams {
  title: string
  content?: string
}

export interface CreateDocumentResult {
  success: boolean
  documentId?: string
  title?: string
  content?: string
  error?: string
}

export interface UpdateDocumentParams {
  documentId: string
  title?: string
  content?: string
}

export interface UpdateDocumentResult {
  success: boolean
  document?: {
    id: string
    title?: string
    content?: string
  }
  error?: string
}

export interface ArchiveDocumentParams {
  documentId: string
}

export interface ArchiveDocumentResult {
  success: boolean
  document?: {
    id: string
    archivedAt: Date
  }
  error?: string
}

export interface AddDocumentToProjectParams {
  documentId: string
  projectId: string
}

export interface AddDocumentToProjectResult {
  success: boolean
  association?: {
    documentId: string
    projectId: string
  }
  error?: string
}

export interface RemoveDocumentFromProjectParams {
  documentId: string
  projectId: string
}

export interface RemoveDocumentFromProjectResult {
  success: boolean
  association?: {
    documentId: string
    projectId: string
  }
  error?: string
}

// ===== CONTACT TOOL TYPES =====

export interface CreateContactParams {
  name?: string
  email: string
}

export interface CreateContactResult {
  success: boolean
  contact?: {
    id: string
    name: string
    email: string
    createdAt: Date
  }
  error?: string
}

export interface UpdateContactParams {
  contactId: string
  name?: string
  email?: string
}

export interface UpdateContactResult {
  success: boolean
  contact?: {
    id: string
    name?: string
    email?: string
    updatedAt: Date
  }
  error?: string
}

export interface ListContactsParams {
  // No parameters needed
}

export interface ListContactsResult {
  success: boolean
  contacts?: Array<{
    id: string
    name: string
    email: string
    createdAt: Date
    updatedAt?: Date
  }>
  error?: string
}

export interface GetContactParams {
  contactId: string
}

export interface GetContactResult {
  success: boolean
  contact?: {
    id: string
    name: string
    email: string
    createdAt: Date
    updatedAt?: Date
    projects?: Array<{
      id: string
      name: string
      description?: string
    }>
  }
  error?: string
}

export interface SearchContactsParams {
  query: string
}

export interface SearchContactsResult {
  success: boolean
  contacts?: Array<{
    id: string
    name: string
    email: string
    createdAt: Date
    updatedAt?: Date
  }>
  query?: string
  error?: string
}

export interface DeleteContactParams {
  contactId: string
}

export interface DeleteContactResult {
  success: boolean
  message?: string
  error?: string
}

export interface GetProjectContactsParams {
  projectId: string
}

export interface GetProjectContactsResult {
  success: boolean
  projectId?: string
  contacts?: Array<{
    id: string
    name: string
    email: string
    createdAt: Date
    updatedAt?: Date
  }>
  error?: string
}

export interface GetContactProjectsParams {
  contactId: string
}

export interface GetContactProjectsResult {
  success: boolean
  contactId?: string
  contact?: {
    name: string
    email: string
  }
  projects?: Array<{
    id: string
    name: string
    description?: string
    createdAt: Date
    updatedAt?: Date
  }>
  error?: string
}

export interface AddContactToProjectParams {
  contactId: string
  projectId: string
}

export interface AddContactToProjectResult {
  success: boolean
  message?: string
  error?: string
}

export interface RemoveContactFromProjectParams {
  contactId: string
  projectId: string
}

export interface RemoveContactFromProjectResult {
  success: boolean
  message?: string
  error?: string
}

export interface GetProjectEmailListParams {
  projectId: string
}

export interface GetProjectEmailListResult {
  success: boolean
  projectId?: string
  emails?: string[]
  formattedList?: string
  count?: number
  error?: string
}

export interface FindContactsByEmailParams {
  emails: string[]
}

export interface FindContactsByEmailResult {
  success: boolean
  results?: Array<{
    email: string
    matched: boolean
    contact?: {
      id: string
      name: string
      email: string
    } | null
  }>
  summary?: {
    total: number
    matched: number
    unmatched: number
    matchedEmails: string[]
    unmatchedEmails: string[]
  }
  error?: string
}

export interface ValidateEmailListParams {
  emails: string[]
}

export interface ValidateEmailListResult {
  success: boolean
  results?: Array<{
    original: string
    normalized: string | null
    valid: boolean
    error: string | null
  }>
  summary?: {
    total: number
    valid: number
    invalid: number
    validEmails: string[]
    invalidEmails: string[]
  }
  error?: string
}

export interface SuggestContactsFromEmailsParams {
  emails: string[]
}

export interface SuggestContactsFromEmailsResult {
  success: boolean
  suggestions?: Array<{
    email: string
    suggestedName: string
    canCreate: boolean
  }>
  summary?: {
    totalEmails: number
    validEmails: number
    existingContacts: number
    newSuggestions: number
  }
  error?: string
}

export interface GetProjectContactEmailsParams {
  projectId: string
}

export interface GetProjectContactEmailsResult {
  success: boolean
  projectId?: string
  emails?: string[]
  formattedList?: string
  count?: number
  error?: string
}

// ===== UNION TYPES =====

export type LLMToolParams =
  | CreateTaskParams
  | UpdateTaskParams
  | MoveTaskParams
  | MoveTaskToProjectParams
  | ArchiveTaskParams
  | UnarchiveTaskParams
  | GetTaskByIdParams
  | GetProjectTasksParams
  | GetOrphanedTasksParams
  | CreateProjectParams
  | ListProjectsParams
  | GetProjectDetailsParams
  | ListDocumentsParams
  | ReadDocumentParams
  | SearchDocumentsParams
  | GetProjectDocumentsParams
  | SearchProjectDocumentsParams
  | CreateDocumentParams
  | UpdateDocumentParams
  | ArchiveDocumentParams
  | AddDocumentToProjectParams
  | RemoveDocumentFromProjectParams
  | CreateContactParams
  | UpdateContactParams
  | ListContactsParams
  | GetContactParams
  | SearchContactsParams
  | DeleteContactParams
  | GetProjectContactsParams
  | GetContactProjectsParams
  | AddContactToProjectParams
  | RemoveContactFromProjectParams
  | GetProjectEmailListParams
  | GetProjectContactEmailsParams
  | FindContactsByEmailParams
  | ValidateEmailListParams
  | SuggestContactsFromEmailsParams

export type LLMToolResult =
  | CreateTaskResult
  | UpdateTaskResult
  | MoveTaskResult
  | MoveTaskToProjectResult
  | ArchiveTaskResult
  | UnarchiveTaskResult
  | GetTaskByIdResult
  | GetProjectTasksResult
  | GetOrphanedTasksResult
  | CreateProjectResult
  | ListProjectsResult
  | GetProjectDetailsResult
  | ListDocumentsResult
  | ReadDocumentResult
  | SearchDocumentsResult
  | GetProjectDocumentsResult
  | SearchProjectDocumentsResult
  | CreateDocumentResult
  | UpdateDocumentResult
  | ArchiveDocumentResult
  | AddDocumentToProjectResult
  | RemoveDocumentFromProjectResult
  | CreateContactResult
  | UpdateContactResult
  | ListContactsResult
  | GetContactResult
  | SearchContactsResult
  | DeleteContactResult
  | GetProjectContactsResult
  | GetContactProjectsResult
  | AddContactToProjectResult
  | RemoveContactFromProjectResult
  | GetProjectEmailListResult
  | GetProjectContactEmailsResult
  | FindContactsByEmailResult
  | ValidateEmailListResult
  | SuggestContactsFromEmailsResult
