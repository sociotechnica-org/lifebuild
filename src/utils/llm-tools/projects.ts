import type { Store } from '@livestore/livestore'
import {
  getProjects$,
  getProjectDetails$,
  getBoardTasks$,
  getDocumentProjectsByProject$,
} from '../../livestore/queries.js'

/**
 * List all available projects
 */
export function listProjects(store: Store): { success: boolean; projects?: any[]; error?: string } {
  try {
    const projects = store.query(getProjects$) as any[]
    return {
      success: true,
      projects: projects.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
      })),
    }
  } catch (error) {
    console.error('Error listing projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get detailed information about a project
 */
export function getProjectDetails(
  store: Store,
  projectId: string
): { success: boolean; project?: any; error?: string } {
  try {
    if (!projectId?.trim()) {
      return { success: false, error: 'Project ID is required' }
    }

    const projects = store.query(getProjectDetails$(projectId.trim())) as any[]

    if (projects.length === 0) {
      return { success: false, error: 'Project not found' }
    }

    const project = projects[0]

    // Get document and task counts using client-side filtering
    const documentProjects = store.query(getDocumentProjectsByProject$(projectId.trim())) as any[]
    const tasks = store.query(getBoardTasks$(projectId.trim())) as any[]

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
  } catch (error) {
    console.error('Error getting project details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get project details',
    }
  }
}
