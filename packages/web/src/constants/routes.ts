/**
 * Centralized route definitions for the application
 * This helps maintain consistency and makes refactoring easier
 */
export const ROUTES = {
  HOME: '/',
  // App routes
  LIFE_MAP: '/life-map',
  DRAFTING_ROOM: '/drafting-room',
  SORTING_ROOM: '/sorting-room',
  SORTING_ROOM_STREAM: '/sorting-room/:stream',
  SYSTEM_BOARD: '/system-board',
  ENTITY_TYPE_GATE: '/drafting-room/new',
  PROJECT_CREATE: '/drafting-room/new/project',
  PROJECT_STAGE1: '/drafting-room/:projectId/stage1',
  PROJECT_STAGE2: '/drafting-room/:projectId/stage2',
  PROJECT_STAGE3: '/drafting-room/:projectId/stage3',
  // System routes
  SYSTEM_CREATE: '/drafting-room/new/system',
  SYSTEM_STAGE2: '/drafting-room/:systemId/system-stage2',
  SYSTEM_STAGE3: '/drafting-room/:systemId/system-stage3',
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
  // App routes
  lifeMap: () => '/life-map',
  draftingRoom: () => '/drafting-room',
  sortingRoom: (stream?: 'gold' | 'silver' | 'bronze') =>
    stream ? `/sorting-room/${stream}` : '/sorting-room',
  systemBoard: () => '/system-board',
  entityTypeGate: () => '/drafting-room/new',
  projectCreate: () => '/drafting-room/new/project',
  projectStage1: (projectId: string) => `/drafting-room/${projectId}/stage1`,
  projectStage2: (projectId: string) => `/drafting-room/${projectId}/stage2`,
  projectStage3: (projectId: string) => `/drafting-room/${projectId}/stage3`,
  // System routes
  systemCreate: () => '/drafting-room/new/system',
  systemStage2: (systemId: string) => `/drafting-room/${systemId}/system-stage2`,
  systemStage3: (systemId: string) => `/drafting-room/${systemId}/system-stage3`,
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
