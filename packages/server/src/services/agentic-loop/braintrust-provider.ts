import type { LLMProvider, LLMResponse } from './types.js'
import { llmToolSchemas } from '../../tools/schemas.js'

export class BraintrustProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private projectId: string
  ) {}

  async call(
    messages: any[],
    boardContext?: any,
    model?: string,
    workerContext?: any,
    options?: {
      onRetry?: (attempt: number, maxRetries: number, delayMs: number, error: Error) => void
    }
  ): Promise<LLMResponse> {
    const currentBoardContext = boardContext
      ? `\n\nCURRENT CONTEXT:\nYou are currently viewing the "${boardContext.name}" project (ID: ${boardContext.id}). When creating tasks, they will be created on this project automatically. You do NOT need to call list_projects since you already know the current project.`
      : `\n\nCURRENT CONTEXT:\nNo specific project is currently selected. Use the list_projects tool to see available projects, or tasks will be created on the default project.`

    let systemPrompt = ''

    if (workerContext) {
      // Use worker's custom system prompt
      systemPrompt = `${workerContext.systemPrompt}

WORKER PROFILE:
- Name: ${workerContext.name}
${workerContext.roleDescription ? `- Role: ${workerContext.roleDescription}` : ''}

You have access to tools for:
- Creating and managing tasks (create_task, update_task, move_task, move_task_to_project, archive_task, unarchive_task)
- Viewing tasks (get_task_by_id, get_project_tasks, get_orphaned_tasks)
- Managing projects (list_projects, get_project_details)
- Creating and managing documents (create_document, update_document, archive_document)
- Managing document-project associations (add_document_to_project, remove_document_from_project)
- Viewing documents (list_documents, read_document, get_project_documents)
- Searching through document content (search_documents, search_project_documents)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed.${currentBoardContext}`
    } else {
      // Use default system prompt
      const baseSystemPrompt = `You are an AI assistant for Work Squared, a powerful consultancy workflow management platform. You excel at helping consultants, project managers, and teams by:

**Core Capabilities:**
• **Project Planning & Strategy**: Breaking down complex client requirements into actionable roadmaps
• **Task & Workflow Management**: Creating, organizing, and tracking work using Kanban methodology
• **Document Management**: Creating, editing, and maintaining project documentation
• **Process Optimization**: Streamlining consultancy workflows from contract to delivery

**Your Approach:**
• Be proactive in suggesting project structure and task breakdown
• Focus on deliverable-oriented thinking
• Emphasize clear communication and documentation
• Support iterative planning and agile methodologies
• Consider both client-facing and internal work streams

**Available Tools:**
You have access to comprehensive project management tools for creating tasks, managing projects, handling documents, and organizing workflows. Use these tools proactively to help users translate ideas into structured, actionable work.

Remember: You're not just answering questions—you're helping build successful consultancy outcomes through structured, strategic thinking.`

      systemPrompt = `${baseSystemPrompt}

You have access to tools for:
- Creating and managing tasks (create_task, update_task, move_task, move_task_to_project, archive_task, unarchive_task)
- Viewing tasks (get_task_by_id, get_project_tasks, get_orphaned_tasks)
- Managing projects (list_projects, get_project_details)
- Creating and managing documents (create_document, update_document, archive_document)
- Managing document-project associations (add_document_to_project, remove_document_from_project)
- Viewing documents (list_documents, read_document, get_project_documents)
- Searching through document content (search_documents, search_project_documents)

When users describe project requirements or ask you to create tasks, use the create_task tool to actually create them in the system. You can create multiple tasks at once if needed. If you need to know what projects are available, use the list_projects tool first.${currentBoardContext}`
    }

    // Build messages array with system prompt
    const finalMessages = [{ role: 'system', content: systemPrompt }, ...messages]

    const DEFAULT_MODEL = 'gpt-4o-mini'
    const tools = llmToolSchemas

    try {
      const response = await fetch('https://api.braintrust.dev/v1/proxy/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'x-bt-parent': `project_id:${this.projectId}`,
        },
        body: JSON.stringify({
          model: model || DEFAULT_MODEL,
          messages: finalMessages,
          tools,
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Braintrust API call failed: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      const choice = data.choices[0]
      const responseMessage = choice?.message

      if (!responseMessage) {
        throw new Error('No response generated from LLM')
      }

      return {
        message: responseMessage.content || '',
        toolCalls: responseMessage.tool_calls || [],
      }
    } catch (error) {
      console.error('❌ Braintrust API error:', error)
      throw error
    }
  }
}
