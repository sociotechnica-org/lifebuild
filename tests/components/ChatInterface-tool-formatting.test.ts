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
    } else if (toolCall.function.name === 'list_projects') { // This is the fix
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

// This simulates the BUGGY version for comparison
function formatToolResultBuggy(toolCall: any, toolResult: any): string {
  let toolResultMessage = ''
  
  if (toolResult.success) {
    if (toolCall.function.name === 'create_task') {
      toolResultMessage = `Task created successfully: "${toolResult.taskTitle}" on board "${toolResult.boardName}" in column "${toolResult.columnName}"${
        toolResult.assigneeName ? ` (assigned to ${toolResult.assigneeName})` : ''
      }. Task ID: ${toolResult.taskId}`
    } else if (toolCall.function.name === 'list_boards') { // BUG: Wrong tool name
      const boardList =
        toolResult.boards?.map((b: any) => `${b.name} (ID: ${b.id})`).join(', ') ||
        'No boards found'
      toolResultMessage = `Available boards: ${boardList}`
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

  it('should demonstrate the bug: list_projects calls get generic response', () => {
    // The buggy version checks for 'list_boards' instead of 'list_projects'
    const buggyResult = formatToolResultBuggy(mockListProjectsCall, mockProjectsResult)
    
    // Bug: returns generic message instead of formatted project list
    expect(buggyResult).toBe('Tool executed successfully')
    expect(buggyResult).not.toContain('Website Redesign')
    expect(buggyResult).not.toContain('Mobile App')
  })

  it('should work correctly after the fix: list_projects calls get formatted response', () => {
    // The fixed version correctly checks for 'list_projects'
    const fixedResult = formatToolResult(mockListProjectsCall, mockProjectsResult)
    
    // Fix: returns properly formatted project list
    expect(fixedResult).toBe('Available projects: Website Redesign (ID: proj-1), Mobile App (ID: proj-2)')
    expect(fixedResult).toContain('Website Redesign')
    expect(fixedResult).toContain('Mobile App')
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

describe('Real-world impact of the bug', () => {
  it('should explain why list_projects tool appears broken to users', () => {
    // When a user asks "What projects do I have?" or "List my projects"
    // The LLM would call the list_projects tool, which would execute successfully
    // But due to the bug, the user would see "Tool executed successfully" 
    // instead of seeing their actual project list
    
    const userQuestion = "What projects do I have?"
    const llmToolCall = { function: { name: 'list_projects', arguments: '{}' } }
    const toolExecutionResult = {
      success: true,
      projects: [
        { id: '1', name: 'Important Project' },
        { id: '2', name: 'Secret Project' },
      ]
    }
    
    // What the user would see with the bug:
    const buggyUserMessage = formatToolResultBuggy(llmToolCall, toolExecutionResult)
    expect(buggyUserMessage).toBe('Tool executed successfully') // Unhelpful!
    
    // What the user should see with the fix:
    const fixedUserMessage = formatToolResult(llmToolCall, toolExecutionResult)
    expect(fixedUserMessage).toBe('Available projects: Important Project (ID: 1), Secret Project (ID: 2)')
    
    // The bug made the list_projects tool appear completely broken from the user's perspective
  })
})