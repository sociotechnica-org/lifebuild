/**
 * Centralized route definitions for the application
 * This helps maintain consistency and makes refactoring easier
 */
export const ROUTES = {
  HOME: '/',
  LIFE_MAP: '/life-map',
  CATEGORY: '/category/:categoryId',
  PROJECTS: '/projects',
  NEW: '/new',
  NEW_LIFE_MAP: '/new/life-map',
  NEW_DRAFTING_ROOM: '/new/drafting-room',
  NEW_SORTING_ROOM: '/new/sorting-room',
  NEW_PROJECT_CREATE: '/new/drafting-room/new',
  NEW_PROJECT_STAGE1: '/new/drafting-room/:projectId/stage1',
  NEW_PROJECT_STAGE2: '/new/drafting-room/:projectId/stage2',
  NEW_PROJECT_STAGE3: '/new/drafting-room/:projectId/stage3',
  NEW_CATEGORY: '/new/category/:categoryId',
  NEW_PROJECTS: '/new/projects',
  NEW_PROJECT: '/new/projects/:projectId',
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
  category: (id: string, tab?: string) => (tab ? `/category/${id}?tab=${tab}` : `/category/${id}`),
  document: (id: string) => `/document/${id}`,
  project: (id: string) => `/project/${id}`,
  newLifeMap: () => '/new/life-map',
  newDraftingRoom: () => '/new/drafting-room',
  newSortingRoom: () => '/new/sorting-room',
  newProjectCreate: () => '/new/drafting-room/new',
  newProjectStage1: (projectId: string) => `/new/drafting-room/${projectId}/stage1`,
  newProjectStage2: (projectId: string) => `/new/drafting-room/${projectId}/stage2`,
  newProjectStage3: (projectId: string) => `/new/drafting-room/${projectId}/stage3`,
  newCategory: (name: string) => `/new/category/${name.toLowerCase()}`,
  newProject: (id: string) => `/new/projects/${id}`,
  contact: (id: string) => `/contacts/${id}`,
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
} as const
