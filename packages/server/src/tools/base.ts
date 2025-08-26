import type { Store } from '@livestore/livestore'

// ===== TYPE DEFINITIONS =====

export interface LLMToolCall {
  name: string
  parameters: any
  result?: any
  error?: string
  status: 'pending' | 'success' | 'error'
}

// ===== VALIDATION HELPERS =====

export const validators = {
  requireEntity: <T>(entities: readonly T[], entityName: string, id: string): T => {
    if (!entities || !Array.isArray(entities)) {
      throw new Error(`Failed to retrieve ${entityName} list`)
    }
    if (entities.length === 0) {
      throw new Error(`${entityName} with ID ${id} not found`)
    }
    const entity = entities[0]
    if (!entity) {
      throw new Error(`${entityName} with ID ${id} not found`)
    }
    return entity
  },

  validateAssignees: (assigneeIds: string[], users: readonly any[]): void => {
    const userIds = new Set(users.map((u: any) => u.id))
    const invalidAssignees = assigneeIds.filter(id => !userIds.has(id))
    if (invalidAssignees.length > 0) {
      throw new Error(`Invalid assignee IDs: ${invalidAssignees.join(', ')}`)
    }
  },

  validateOptionalAssignees: (assigneeIds: string[] | undefined, users: readonly any[]): void => {
    if (assigneeIds && assigneeIds.length > 0) {
      validators.validateAssignees(assigneeIds, users)
    }
  },
}

// ===== SCHEMA BUILDERS =====

export const toolDef = (name: string, description: string, params: any) => ({
  type: 'function',
  function: { name, description, parameters: params },
})

export const requiredString = (description: string) => ({
  type: 'string',
  description,
})

export const optionalString = (description: string) => ({
  type: 'string',
  description,
})

export const optionalNumber = (description: string) => ({
  type: 'number',
  description,
})

export const stringArray = (description: string) => ({
  type: 'array',
  items: { type: 'string' },
  description,
})

// ===== ERROR HANDLING WRAPPER =====

export function wrapToolFunction<T extends Record<string, any>>(
  fn: (store: Store, params: T) => any
) {
  return (store: Store, params: T) => {
    try {
      return fn(store, params)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}

// Specialized wrapper for functions that take a single string parameter
export function wrapStringParamFunction(fn: (store: Store, param: string) => any) {
  return (store: Store, param: string) => {
    try {
      return fn(store, param)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}

// Specialized wrapper for functions that take no parameters
export function wrapNoParamFunction(fn: (store: Store) => any) {
  return (store: Store) => {
    try {
      return fn(store)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }
}
