/**
 * Centralized route definitions for the application
 * This helps maintain consistency and makes refactoring easier
 */
export const ROUTES = {
  HOME: '/',
  LIFE_MAP: '/life-map',
  CATEGORY: '/category/:categoryId',
  PROJECTS: '/projects',
  TASKS: '/tasks',
  TEAM: '/team',
  DOCUMENTS: '/documents',
  CONTACTS: '/contacts',
  CONTACT: '/contacts/:contactId',
  CATEGORY: '/category/:categoryId',
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
  category: (categoryId: string) => `/category/${categoryId}`,
  document: (id: string) => `/document/${id}`,
  project: (id: string) => `/project/${id}`,
  contact: (id: string) => `/contacts/${id}`,
  category: (id: string, tab?: string) => (tab ? `/category/${id}?tab=${tab}` : `/category/${id}`),
  adminUser: (userEmail: string) => `/admin/users/${encodeURIComponent(userEmail)}`,
} as const

/**
 * Route patterns for matching
 */
export const ROUTE_PATTERNS = {
  CATEGORY: '/category/',
  DOCUMENT: '/document/',
  PROJECT: '/project/',
  CONTACT: '/contacts/',
  CATEGORY: '/category/',
} as const
