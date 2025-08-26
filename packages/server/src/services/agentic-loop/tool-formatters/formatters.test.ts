import { describe, it, expect } from 'vitest'
import { TaskToolFormatter } from './task-formatter.js'
import { DocumentToolFormatter } from './document-formatter.js'
import { ProjectToolFormatter } from './project-formatter.js'
import { ToolResultFormatterService } from './formatter-service.js'

describe('Tool Formatters', () => {
  describe('TaskToolFormatter', () => {
    const formatter = new TaskToolFormatter()

    it('should identify task tools correctly', () => {
      expect(formatter.canFormat('create_task')).toBe(true)
      expect(formatter.canFormat('update_task')).toBe(true)
      expect(formatter.canFormat('create_document')).toBe(false)
    })

    it('should format create_task result', () => {
      const result = formatter.format(
        {
          success: true,
          taskId: 'task-123',
          taskTitle: 'Test Task',
          boardName: 'Project Board',
          columnName: 'To Do',
          assigneeName: 'John Doe',
        },
        { function: { name: 'create_task' } }
      )

      expect(result).toContain('Task created successfully')
      expect(result).toContain('Test Task')
      expect(result).toContain('Project Board')
      expect(result).toContain('To Do')
      expect(result).toContain('John Doe')
      expect(result).toContain('task-123')
    })

    it('should format update_task result', () => {
      const result = formatter.format(
        {
          success: true,
          task: {
            id: 'task-123',
            title: 'Updated Task',
            description: 'New description',
          },
        },
        { function: { name: 'update_task' } }
      )

      expect(result).toContain('Task updated successfully')
      expect(result).toContain('task-123')
      expect(result).toContain('Updated Task')
      expect(result).toContain('Description updated')
    })

    it('should format get_task_by_id when task not found', () => {
      const result = formatter.format({ success: true }, { function: { name: 'get_task_by_id' } })

      expect(result).toBe('Task not found')
    })

    it('should format get_project_tasks with multiple tasks', () => {
      const result = formatter.format(
        {
          success: true,
          tasks: [
            { id: 'task-1', title: 'Task 1', columnId: 'col-1', position: 0 },
            { id: 'task-2', title: 'Task 2', columnId: 'col-2', position: 1 },
          ],
        },
        { function: { name: 'get_project_tasks' } }
      )

      expect(result).toContain('Project tasks:')
      expect(result).toContain('Task 1 (ID: task-1)')
      expect(result).toContain('Task 2 (ID: task-2)')
      expect(result).toContain('Column: col-1')
      expect(result).toContain('Position: 0')
    })
  })

  describe('DocumentToolFormatter', () => {
    const formatter = new DocumentToolFormatter()

    it('should identify document tools correctly', () => {
      expect(formatter.canFormat('create_document')).toBe(true)
      expect(formatter.canFormat('add_document_to_project')).toBe(true)
      expect(formatter.canFormat('create_task')).toBe(false)
    })

    it('should format create_document result', () => {
      const result = formatter.format(
        {
          success: true,
          documentId: 'doc-123',
          title: 'Test Document',
          content: 'This is the content',
        },
        { function: { name: 'create_document' } }
      )

      expect(result).toContain('Document created successfully')
      expect(result).toContain('Test Document')
      expect(result).toContain('doc-123')
      expect(result).toContain('19 characters') // content length
    })

    it('should format add_document_to_project result', () => {
      const result = formatter.format(
        {
          success: true,
          association: {
            documentId: 'doc-123',
            projectId: 'proj-456',
          },
        },
        { function: { name: 'add_document_to_project' } }
      )

      expect(result).toContain('Document successfully added to project')
      expect(result).toContain('doc-123')
      expect(result).toContain('proj-456')
    })

    it('should format search_documents with results', () => {
      const result = formatter.format(
        {
          success: true,
          results: [
            { id: 'doc-1', title: 'Doc 1', snippet: 'Snippet 1' },
            { id: 'doc-2', title: 'Doc 2', snippet: 'Snippet 2' },
          ],
        },
        { function: { name: 'search_documents' } }
      )

      expect(result).toContain('Search results:')
      expect(result).toContain('Doc 1 (ID: doc-1)')
      expect(result).toContain('Snippet: Snippet 1')
    })
  })

  describe('ProjectToolFormatter', () => {
    const formatter = new ProjectToolFormatter()

    it('should format list_projects result', () => {
      const result = formatter.format(
        {
          success: true,
          projects: [
            { id: 'proj-1', name: 'Project 1', description: 'First project' },
            { id: 'proj-2', name: 'Project 2' },
          ],
        },
        { function: { name: 'list_projects' } }
      )

      expect(result).toContain('Available projects:')
      expect(result).toContain('Project 1 (ID: proj-1) - First project')
      expect(result).toContain('Project 2 (ID: proj-2)')
    })

    it('should format get_project_details result', () => {
      const result = formatter.format(
        {
          success: true,
          project: {
            id: 'proj-1',
            name: 'Test Project',
            description: 'A test project',
            documentCount: 5,
            taskCount: 10,
          },
        },
        { function: { name: 'get_project_details' } }
      )

      expect(result).toContain('Project details:')
      expect(result).toContain('ID: proj-1')
      expect(result).toContain('Name: Test Project')
      expect(result).toContain('Description: A test project')
      expect(result).toContain('Document count: 5')
      expect(result).toContain('Task count: 10')
    })
  })

  describe('ToolResultFormatterService', () => {
    const service = new ToolResultFormatterService()

    it('should format successful tool results', () => {
      const result = service.format(
        {
          success: true,
          taskId: 'task-123',
          taskTitle: 'Test',
          boardName: 'Board',
          columnName: 'Column',
        },
        { function: { name: 'create_task' } }
      )

      expect(result).toContain('Task created successfully')
    })

    it('should format error results', () => {
      const result = service.format(
        {
          success: false,
          error: 'Task not found',
        },
        { function: { name: 'update_task' } }
      )

      expect(result).toBe('Error: Task not found')
    })

    it('should use default format for unknown tools', () => {
      const result = service.format(
        {
          success: true,
          customField: 'value',
        },
        { function: { name: 'unknown_tool' } }
      )

      expect(result).toContain('Tool executed successfully')
      expect(result).toContain('customField')
      expect(result).toContain('value')
    })

    it('should format error objects', () => {
      const result = service.formatError(new Error('Something went wrong'), {
        function: { name: 'test_tool' },
      })

      expect(result).toBe('Error executing tool test_tool: Something went wrong')
    })
  })
})
