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
  SORTING_ROOM_STREAM: '/sorting-room/:stream',
  PROJECT_CREATE: '/drafting-room/new',
  PROJECT_STAGE1: '/drafting-room/:projectId/stage1',
  PROJECT_STAGE2: '/drafting-room/:projectId/stage2',
  PROJECT_STAGE3: '/drafting-room/:projectId/stage3',
  PROJECTS: '/projects',
  PROJECT: '/projects/:projectId',
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
  sortingRoom: (stream?: 'gold' | 'silver' | 'bronze') =>
    stream ? `/sorting-room/${stream}` : '/sorting-room',
  projectCreate: () => '/drafting-room/new',
  projectStage1: (projectId: string) => `/drafting-room/${projectId}/stage1`,
  projectStage2: (projectId: string) => `/drafting-room/${projectId}/stage2`,
  projectStage3: (projectId: string) => `/drafting-room/${projectId}/stage3`,
  project: (id: string) => `/projects/${id}`,
  // Admin routes
  adminUser: (userEmail: string) => `/admin/users/${encodeURIComponent(userEmail)}`,
} as const

/**
 * Route patterns for matching
 */
export const ROUTE_PATTERNS = {
  PROJECT: '/projects/',
} as const
