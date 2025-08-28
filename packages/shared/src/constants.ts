/**
 * Shared constants used across web and server packages
 */

/**
 * Default Kanban columns created when a new project is created
 */
export const DEFAULT_KANBAN_COLUMNS = [
  { name: 'Todo', position: 0 },
  { name: 'Doing', position: 1 },
  { name: 'In Review', position: 2 },
  { name: 'Done', position: 3 },
] as const

/**
 * Type-safe access to default column names
 */
export type DefaultColumnName = typeof DEFAULT_KANBAN_COLUMNS[number]['name']