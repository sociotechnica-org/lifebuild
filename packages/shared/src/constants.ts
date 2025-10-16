/**
 * Shared constants used across web and server packages
 */

/**
 * Default Kanban columns created when a new project is created
 * @deprecated Use TASK_STATUSES instead for v2 status-based tasks
 */
export const DEFAULT_KANBAN_COLUMNS = [
  { name: 'Todo', position: 0 },
  { name: 'Doing', position: 1 },
  { name: 'In Review', position: 2 },
  { name: 'Done', position: 3 },
] as const

/**
 * Type-safe access to default column names
 * @deprecated Use TaskStatus instead
 */
export type DefaultColumnName = (typeof DEFAULT_KANBAN_COLUMNS)[number]['name']

// ============================================================================
// V2 STATUS-BASED CONSTANTS
// ============================================================================

/**
 * Valid task status values
 */
export const TASK_STATUSES = ['todo', 'doing', 'in_review', 'done'] as const

// Note: TaskStatus type is defined in livestore/schema.ts to avoid circular dependencies

/**
 * Status column definitions for Kanban board display
 * These replace the old dynamic columns with fixed status-based columns
 */
export const STATUS_COLUMNS = [
  {
    id: 'todo',
    name: 'Todo',
    status: 'todo' as const,
    position: 0,
  },
  {
    id: 'doing',
    name: 'Doing',
    status: 'doing' as const,
    position: 1,
  },
  {
    id: 'in_review',
    name: 'In Review',
    status: 'in_review' as const,
    position: 2,
  },
  {
    id: 'done',
    name: 'Done',
    status: 'done' as const,
    position: 3,
  },
] as const

/**
 * Type for status column definition
 */
export type StatusColumn = (typeof STATUS_COLUMNS)[number]

// ============================================================================
// PROJECT CATEGORIES
// ============================================================================

/**
 * Project category type
 */
export type ProjectCategory =
  | 'health'
  | 'relationships'
  | 'finances'
  | 'growth'
  | 'leisure'
  | 'spirituality'
  | 'home'
  | 'contribution'

/**
 * Default project categories for UI display
 * These are hardcoded options - no database table needed
 */
export const PROJECT_CATEGORIES = [
  {
    value: 'health' as const,
    name: 'Health & Well-Being',
    description: 'Physical health, fitness, mental wellness, self-care',
    colorHex: '#10B981',
  },
  {
    value: 'relationships' as const,
    name: 'Relationships',
    description: 'Family, friends, romantic relationships, social connections',
    colorHex: '#EC4899',
  },
  {
    value: 'finances' as const,
    name: 'Finances',
    description: 'Income, expenses, investments, financial planning',
    colorHex: '#3B82F6',
  },
  {
    value: 'growth' as const,
    name: 'Personal Growth & Learning',
    description: 'Education, skills, personal development, hobbies',
    colorHex: '#8B5CF6',
  },
  {
    value: 'leisure' as const,
    name: 'Leisure & Lifestyle',
    description: 'Recreation, entertainment, travel, fun activities',
    colorHex: '#F59E0B',
  },
  {
    value: 'spirituality' as const,
    name: 'Spirituality & Meaning',
    description: 'Religion, philosophy, purpose, values, mindfulness',
    colorHex: '#6366F1',
  },
  {
    value: 'home' as const,
    name: 'Home & Environment',
    description: 'Living space, organization, home projects, environment',
    colorHex: '#14B8A6',
  },
  {
    value: 'contribution' as const,
    name: 'Contribution & Service',
    description: 'Community service, volunteering, giving back, impact',
    colorHex: '#EF4444',
  },
] as const

/**
 * Helper to get category display information
 */
export function getCategoryInfo(category: ProjectCategory | null | undefined) {
  if (!category) return null
  return PROJECT_CATEGORIES.find(c => c.value === category) || null
}
