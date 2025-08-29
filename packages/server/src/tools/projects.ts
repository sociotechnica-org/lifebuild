import type { Store } from '@livestore/livestore'
import {
  getProjects$,
  getProjectDetails$,
  getBoardTasks$,
  getDocumentProjectsByProject$,
} from '@work-squared/shared/queries'
import { events } from '@work-squared/shared/schema'
import { DEFAULT_KANBAN_COLUMNS } from '@work-squared/shared'
import {
  validators,
  wrapStringParamFunction,
  wrapNoParamFunction,
  wrapToolFunction,
} from './base.js'
import type {
  CreateProjectParams,
  CreateProjectResult,
  ListProjectsResult,
  GetProjectDetailsResult,
} from './types.js'

/**
 * Create a new project (core implementation)
 */
function createProjectCore(store: Store, params: CreateProjectParams): CreateProjectResult {
  try {
    const projectId = crypto.randomUUID()
    const now = new Date()

    // Emit project creation event
    store.commit(
      events.projectCreated({
        id: projectId,
        name: params.name,
        description: params.description,
        createdAt: now,
      })
    )

    // Create default Kanban columns for the new project
    for (const column of DEFAULT_KANBAN_COLUMNS) {
      store.commit(
        events.columnCreated({
          id: crypto.randomUUID(),
          projectId: projectId,
          name: column.name,
          position: column.position,
          createdAt: now,
        })
      )
    }

    return {
      success: true,
      project: {
        id: projectId,
        name: params.name,
        description: params.description,
        createdAt: now,
      },
    }
  } catch (error) {
    console.error('Error creating project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * List all available projects (core implementation)
 */
function listProjectsCore(store: Store): ListProjectsResult {
  const projects = store.query(getProjects$) as any[]
  return {
    success: true,
    projects: projects
      .filter(p => p != null)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
      })),
  }
}

/**
 * Get detailed information about a project (core implementation)
 */
function getProjectDetailsCore(store: Store, projectId: string): GetProjectDetailsResult {
  const projects = store.query(getProjectDetails$(projectId)) as any[]
  const project = validators.requireEntity(projects, 'Project', projectId)

  // Get document and task counts using client-side filtering
  const documentProjects = store.query(getDocumentProjectsByProject$(projectId)) as any[]
  const tasks = store.query(getBoardTasks$(projectId)) as any[]

  return {
    success: true,
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      documentCount: documentProjects.length,
      taskCount: tasks.length,
    },
  }
}

// Export wrapped versions for external use
export const createProject = wrapToolFunction(createProjectCore)
export const listProjects = wrapNoParamFunction(listProjectsCore)
export const getProjectDetails = wrapStringParamFunction(getProjectDetailsCore)
