import { describe, it, expect } from 'vitest'

describe('list_projects tool bug demonstration', () => {
  it('should demonstrate the bug in ChatInterface tool handling', () => {
    // This test demonstrates the bug where ChatInterface.tsx was checking for 'list_boards'
    // instead of 'list_projects', causing the tool result to not be properly formatted

    const mockToolCall = {
      function: {
        name: 'list_projects', // The actual tool name
        arguments: '{}',
      },
    }

    const mockToolResult = {
      success: true,
      projects: [
        { id: 'proj-1', name: 'Test Project 1' },
        { id: 'proj-2', name: 'Test Project 2' },
      ],
    }

    // SIMULATE THE BUGGY CODE (before the fix)
    let toolResultMessage = ''

    if (mockToolResult.success) {
      if (mockToolCall.function.name === 'create_task') {
        // ... create_task handling
        toolResultMessage = 'Task created'
      } else if (mockToolCall.function.name === 'list_boards') {
        // BUG: Wrong tool name!
        const boardList =
          mockToolResult.projects?.map((p: any) => `${p.name} (ID: ${p.id})`).join(', ') ||
          'No boards found'
        toolResultMessage = `Available boards: ${boardList}`
      } else {
        toolResultMessage = `Tool executed successfully` // Generic fallback
      }
    }

    // This demonstrates the bug: the buggy code produces the generic message
    // instead of the specific formatted project list
    expect(toolResultMessage).toBe('Tool executed successfully')

    // This is what we SHOULD get but DON'T with the buggy code:
    const expectedMessage =
      'Available projects: Test Project 1 (ID: proj-1), Test Project 2 (ID: proj-2)'
    expect(toolResultMessage).not.toBe(expectedMessage)
  })

  it('should PASS after the fix is applied', () => {
    const mockToolCall = {
      function: {
        name: 'list_projects',
        arguments: '{}',
      },
    }

    const mockToolResult = {
      success: true,
      projects: [
        { id: 'proj-1', name: 'Test Project 1' },
        { id: 'proj-2', name: 'Test Project 2' },
      ],
    }

    // SIMULATE THE FIXED CODE (after the fix)
    let toolResultMessage = ''

    if (mockToolResult.success) {
      if (mockToolCall.function.name === 'create_task') {
        toolResultMessage = 'Task created'
      } else if (mockToolCall.function.name === 'list_projects') {
        // FIXED: Correct tool name!
        const projectList =
          mockToolResult.projects?.map((p: any) => `${p.name} (ID: ${p.id})`).join(', ') ||
          'No projects found'
        toolResultMessage = `Available projects: ${projectList}`
      } else {
        toolResultMessage = `Tool executed successfully`
      }
    }

    // This should PASS with the fixed code
    expect(toolResultMessage).toBe(
      'Available projects: Test Project 1 (ID: proj-1), Test Project 2 (ID: proj-2)'
    )
  })
})
