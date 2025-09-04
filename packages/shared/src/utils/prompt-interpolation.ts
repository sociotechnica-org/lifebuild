import type { RecurringTask } from '../livestore/schema.js'

export interface PromptValidationResult {
  isValid: boolean
  errors: string[]
  variables: string[]
}

const AVAILABLE_VARIABLES = [
  'id',
  'name',
  'description',
  'prompt',
  'intervalHours',
  'enabled',
  'projectId',
  'lastExecutedAt',
  'nextExecutionAt',
  'createdAt',
  'updatedAt',
] as const

type AvailableVariable = (typeof AVAILABLE_VARIABLES)[number]

export function interpolateRecurringTaskPrompt(template: string, task: RecurringTask): string {
  if (!template.trim()) {
    return ''
  }

  let result = template

  // Replace each variable in the template
  for (const variable of AVAILABLE_VARIABLES) {
    const placeholder = `{{${variable}}}`
    const value = formatTaskValue(task[variable], variable)
    result = result.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value)
  }

  return result
}

export function validatePromptTemplate(template: string): PromptValidationResult {
  const errors: string[] = []
  const variables: string[] = []

  if (!template.trim()) {
    return { isValid: true, errors: [], variables: [] }
  }

  // Check for malformed brackets first
  const openBrackets = (template.match(/\{\{/g) || []).length
  const closeBrackets = (template.match(/\}\}/g) || []).length

  if (openBrackets !== closeBrackets) {
    errors.push('Malformed template: mismatched brackets detected')
    // Return early if brackets are malformed to avoid confusing error messages
    return { isValid: false, errors, variables: [] }
  }

  // Find all {{variable}} patterns
  const variablePattern = /\{\{([^}]*)\}\}/g
  const matches = Array.from(template.matchAll(variablePattern))

  // Validate each variable
  for (const match of matches) {
    const variableName = match[1]?.trim() // "variable"

    if (!variableName) {
      errors.push('Empty variable name: {{}} is not allowed')
      continue
    }

    // Check if variable is available
    if (!AVAILABLE_VARIABLES.includes(variableName as AvailableVariable)) {
      const availableList = AVAILABLE_VARIABLES.join('`, `{{')
      errors.push(
        `Invalid variable: {{${variableName}}} - available variables are: {{${availableList}}}`
      )
      continue
    }

    variables.push(variableName)
  }

  // Remove duplicates from variables array
  const uniqueVariables = Array.from(new Set(variables))

  return {
    isValid: errors.length === 0,
    errors,
    variables: uniqueVariables,
  }
}

export function getAvailableVariables(): readonly string[] {
  return AVAILABLE_VARIABLES
}

function formatTaskValue(value: unknown, variable: AvailableVariable): string {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return `[${variable} not set]`
  }

  // Format dates
  if (value instanceof Date) {
    return value.toISOString()
  }

  // Format booleans
  if (typeof value === 'boolean') {
    return value.toString()
  }

  // Convert to string
  return String(value)
}
