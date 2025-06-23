import { describe, it, expect } from 'vitest'

// This function extracts the tool result formatting logic from ChatInterface.tsx
// so we can test it in isolation without needing API calls
function formatToolResult(toolCall: any, toolResult: any): string {
  let toolResultMessage = ''

  if (toolResult.success) {
    if (toolCall.function.name === 'create_task') {
      toolResultMessage = `Task created successfully: "${toolResult.taskTitle}" on board "${toolResult.boardName}" in column "${toolResult.columnName}"${
        toolResult.assigneeName ? ` (assigned to ${toolResult.assigneeName})` : ''
      }. Task ID: ${toolResult.taskId}`
    } else if (toolCall.function.name === 'list_projects') {
      const projectList =
        toolResult.projects?.map((p: any) => `${p.name} (ID: ${p.id})`).join(', ') ||
        'No projects found'
      toolResultMessage = `Available projects: ${projectList}`
    } else {
      toolResultMessage = `Tool executed successfully`
    }
  } else {
    toolResultMessage = `Error: ${toolResult.error}`
  }

  return toolResultMessage
}

describe('ChatInterface tool result formatting', () => {
  const mockListProjectsCall = {
    function: {
      name: 'list_projects',
      arguments: '{}',
    },
  }

  const mockProjectsResult = {
    success: true,
    projects: [
      { id: 'proj-1', name: 'Website Redesign' },
      { id: 'proj-2', name: 'Mobile App' },
    ],
  }

  it('should format list_projects tool results correctly', () => {
    const result = formatToolResult(mockListProjectsCall, mockProjectsResult)

    expect(result).toBe(
      'Available projects: Website Redesign (ID: proj-1), Mobile App (ID: proj-2)'
    )
    expect(result).toContain('Website Redesign')
    expect(result).toContain('Mobile App')
  })

  it('should handle empty projects list correctly', () => {
    const emptyResult = {
      success: true,
      projects: [],
    }

    const result = formatToolResult(mockListProjectsCall, emptyResult)
    expect(result).toBe('Available projects: No projects found')
  })

  it('should handle tool execution errors', () => {
    const errorResult = {
      success: false,
      error: 'Database connection failed',
    }

    const result = formatToolResult(mockListProjectsCall, errorResult)
    expect(result).toBe('Error: Database connection failed')
  })
})
