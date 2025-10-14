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
