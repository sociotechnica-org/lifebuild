/**
 * Centralized route definitions for the application
 * This helps maintain consistency and makes refactoring easier
 */
export const ROUTES = {
  HOME: '/',
  // New UI routes (now the default)
  LIFE_MAP: '/life-map',
  DRAFTING_ROOM: '/drafting-room',
  SORTING_ROOM: '/sorting-room',
  PROJECT_CREATE: '/drafting-room/new',
  PROJECT_STAGE1: '/drafting-room/:projectId/stage1',
  PROJECT_STAGE2: '/drafting-room/:projectId/stage2',
  PROJECT_STAGE3: '/drafting-room/:projectId/stage3',
  PROJECTS: '/projects',
  PROJECT: '/projects/:projectId',
  // Old UI routes (now under /old)
  OLD: '/old',
  OLD_LIFE_MAP: '/old/life-map',
  OLD_CATEGORY: '/old/category/:categoryId',
  OLD_PROJECTS: '/old/projects',
  OLD_PROJECT: '/old/project/:projectId',
  OLD_TASKS: '/old/tasks',
  OLD_TEAM: '/old/team',
  OLD_DOCUMENTS: '/old/documents',
  OLD_DOCUMENT: '/old/document/:documentId',
  OLD_CONTACTS: '/old/contacts',
  OLD_CONTACT: '/old/contacts/:contactId',
  OLD_SETTINGS: '/old/settings',
  // Legacy aliases for old route constants (for backwards compatibility with Navigation.tsx etc)
  TASKS: '/old/tasks',
  TEAM: '/old/team',
  DOCUMENTS: '/old/documents',
  DOCUMENT: '/old/document/:documentId',
  CONTACTS: '/old/contacts',
  CONTACT: '/old/contacts/:contactId',
  SETTINGS: '/settings',
  // Auth and admin routes (unchanged)
  ADMIN: '/admin',
  ADMIN_USER: '/admin/users/:userEmail',
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const

/**
 * Route generators for dynamic routes
 */
export const generateRoute = {
  // New UI routes (default)
  lifeMap: () => '/life-map',
  draftingRoom: () => '/drafting-room',
  sortingRoom: () => '/sorting-room',
  projectCreate: () => '/drafting-room/new',
  projectStage1: (projectId: string) => `/drafting-room/${projectId}/stage1`,
  projectStage2: (projectId: string) => `/drafting-room/${projectId}/stage2`,
  projectStage3: (projectId: string) => `/drafting-room/${projectId}/stage3`,
  project: (id: string) => `/projects/${id}`,
  // Old UI routes
  oldLifeMap: () => '/old/life-map',
  oldCategory: (id: string, tab?: string) =>
    tab ? `/old/category/${id}?tab=${tab}` : `/old/category/${id}`,
  oldDocument: (id: string) => `/old/document/${id}`,
  oldProject: (id: string) => `/old/project/${id}`,
  oldContact: (id: string) => `/old/contacts/${id}`,
  // Admin routes
  adminUser: (userEmail: string) => `/admin/users/${encodeURIComponent(userEmail)}`,
} as const

/**
 * Route patterns for matching
 */
export const ROUTE_PATTERNS = {
  PROJECT: '/projects/',
  OLD_CATEGORY: '/old/category/',
  OLD_DOCUMENT: '/old/document/',
  OLD_PROJECT: '/old/project/',
  OLD_CONTACT: '/old/contacts/',
  // Legacy aliases
  DOCUMENT: '/old/document/',
  CONTACT: '/old/contacts/',
} as const
