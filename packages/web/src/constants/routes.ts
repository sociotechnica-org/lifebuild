/**
 * Centralized route definitions for the application
 * This helps maintain consistency and makes refactoring easier
 */
export const ROUTES = {
  HOME: '/',
  HOME_NEW: '/home',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  TEAM: '/team',
  DOCUMENTS: '/documents',
  CONTACTS: '/contacts',
  CONTACT: '/contacts/:contactId',
  HISTORY: '/history',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  ADMIN_USER: '/admin/users/:userEmail',
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
  contact: (id: string) => `/contacts/${id}`,
  adminUser: (userEmail: string) => `/admin/users/${encodeURIComponent(userEmail)}`,
} as const

/**
 * Route patterns for matching
 */
export const ROUTE_PATTERNS = {
  DOCUMENT: '/document/',
  PROJECT: '/project/',
  CONTACT: '/contacts/',
} as const
