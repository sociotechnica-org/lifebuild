/**
 * Centralized route definitions for the application
 * This helps maintain consistency and makes refactoring easier
 */
export const ROUTES = {
  HOME: '/',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  TEAM: '/team',
  DOCUMENTS: '/documents',
  HISTORY: '/history',
  SETTINGS: '/settings',
  DOCUMENT: '/document/:documentId',
  PROJECT: '/project/:projectId',
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const

/**
 * Route generators for dynamic routes
 */
export const generateRoute = {
  document: (id: string) => `/document/${id}`,
  project: (id: string) => `/project/${id}`,
} as const

/**
 * Route patterns for matching
 */
export const ROUTE_PATTERNS = {
  DOCUMENT: '/document/',
  PROJECT: '/project/',
} as const
