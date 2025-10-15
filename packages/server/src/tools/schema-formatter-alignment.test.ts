import { describe, it, expect } from 'vitest'
import { TaskToolFormatter } from '../services/agentic-loop/tool-formatters/task-formatter.js'
import { DocumentToolFormatter } from '../services/agentic-loop/tool-formatters/document-formatter.js'
import { ContactToolFormatter } from '../services/agentic-loop/tool-formatters/contact-formatter.js'

describe('Schema-Formatter Alignment', () => {
  describe('Task Formatters', () => {
    it('create_task formatter uses projectName and status', () => {
      const formatter = new TaskToolFormatter()

      // Test with status-based task creation
      const result = {
        success: true,
        taskId: 'task-123',
        taskTitle: 'Test Task',
        projectName: 'Test Project',
        status: 'todo',
        assigneeNames: ['John', 'Jane'],
      }

      const formatted = formatter.format(result, {
        function: { name: 'create_task' },
      })

      expect(formatted).toContain('Test Project')
      expect(formatted).toContain('status "todo"')
      expect(formatted).toContain('John, Jane')
      expect(formatted).not.toContain('board')
      expect(formatted).not.toContain('column')
    })

    it('move_task_within_project formatter describes status change', () => {
      const formatter = new TaskToolFormatter()

      const result = {
        success: true,
        task: {
          id: 'task-123',
          status: 'doing',
          position: 0,
        },
      }

      const formatted = formatter.format(result, {
        function: { name: 'move_task_within_project' },
      })

      expect(formatted).toContain('within project')
      expect(formatted).toContain('task-123')
      expect(formatted).toContain('doing')
      expect(formatted).not.toContain('column')
    })

    it('orphan_task formatter describes orphaning', () => {
      const formatter = new TaskToolFormatter()

      const result = {
        success: true,
        task: {
          id: 'task-123',
          status: 'todo',
          position: 0,
        },
      }

      const formatted = formatter.format(result, {
        function: { name: 'orphan_task' },
      })

      expect(formatted).toContain('orphaned')
      expect(formatted).toContain('task-123')
      expect(formatted).not.toContain('column')
    })

    it('get_project_tasks includes project name and task statuses', () => {
      const formatter = new TaskToolFormatter()

      const result = {
        success: true,
        projectName: 'Test Project',
        tasks: [
          {
            id: 'task-1',
            title: 'Task 1',
            status: 'todo',
            position: 0,
          },
          {
            id: 'task-2',
            title: 'Task 2',
            status: 'doing',
            position: 1,
          },
        ],
      }

      const formatted = formatter.format(result, {
        function: { name: 'get_project_tasks' },
      })

      expect(formatted).toContain('Test Project')
      expect(formatted).toContain('todo')
      expect(formatted).toContain('doing')
      expect(formatted).not.toContain('column')
    })
  })

  describe('Date Formatting', () => {
    it('document formatter should use ISO strings for dates', () => {
      const formatter = new DocumentToolFormatter()

      const result = {
        success: true,
        documents: [
          {
            id: 'doc-1',
            title: 'Document 1',
            updatedAt: new Date('2024-01-15T10:30:00Z'),
          },
        ],
      }

      const formatted = formatter.format(result, {
        function: { name: 'list_documents' },
      })

      expect(formatted).toContain('2024-01-15T10:30:00.000Z')
      expect(formatted).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // No locale-specific dates
    })
  })

  describe('Contact Formatter', () => {
    it('formats contact list with proper CHORUS_TAG', () => {
      const formatter = new ContactToolFormatter()

      const result = {
        success: true,
        contacts: [
          {
            id: 'contact-1',
            name: 'John Doe',
            email: 'john@example.com',
          },
        ],
      }

      const formatted = formatter.format(result, {
        function: { name: 'list_contacts' },
      })

      expect(formatted).toContain('John Doe')
      expect(formatted).toContain('john@example.com')
      expect(formatted).toContain('<CHORUS_TAG path="contact:contact-1">')
    })

    it('formats validation results clearly', () => {
      const formatter = new ContactToolFormatter()

      const result = {
        success: true,
        valid: ['valid@example.com'],
        invalid: ['not-an-email'],
        duplicates: ['dup@example.com'],
      }

      const formatted = formatter.format(result, {
        function: { name: 'validate_email_list' },
      })

      expect(formatted).toContain('Valid emails (1)')
      expect(formatted).toContain('valid@example.com')
      expect(formatted).toContain('Invalid emails (1)')
      expect(formatted).toContain('not-an-email')
      expect(formatted).toContain('Duplicate emails (1)')
      expect(formatted).toContain('dup@example.com')
    })
  })
})
