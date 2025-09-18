import type {
  LLMProvider,
  LLMResponse,
  LLMMessage,
  BoardContext,
  WorkerContext,
  LLMCallOptions,
} from './types.js'
import { llmToolSchemas } from '../../tools/schemas.js'
import { InputValidator } from './input-validator.js'
import { RetryableOperation } from '../retryable-operation.js'

export class BraintrustProvider implements LLMProvider {
  private inputValidator: InputValidator
  private retryableOperation: RetryableOperation

  constructor(
    private apiKey: string,
    private projectId: string,
    customValidator?: InputValidator
  ) {
    this.inputValidator = customValidator ?? new InputValidator()
    this.retryableOperation = RetryableOperation.forHttp()
  }

  async call(
    messages: LLMMessage[],
    boardContext?: BoardContext,
    model?: string,
    workerContext?: WorkerContext,
    _options?: LLMCallOptions
  ): Promise<LLMResponse> {
    // Validate input messages
    const messageValidation = this.inputValidator.validateMessages(messages)
    if (!messageValidation.isValid) {
      console.warn('🚨 Invalid input messages blocked:', messageValidation.reason)
      throw new Error(`Input validation failed: ${messageValidation.reason}`)
    }
    const validatedMessages = JSON.parse(messageValidation.sanitizedContent!) as LLMMessage[]

    // Validate board context
    let sanitizedBoardContext: BoardContext | undefined = boardContext
    if (boardContext) {
      const boardValidation = this.inputValidator.validateBoardContext(boardContext)
      if (!boardValidation.isValid) {
        console.warn('🚨 Invalid board context blocked:', boardValidation.reason)
        throw new Error(`Board context validation failed: ${boardValidation.reason}`)
      }
      sanitizedBoardContext = boardValidation.sanitizedContent
        ? (JSON.parse(boardValidation.sanitizedContent) as BoardContext)
        : boardContext
    }

    // Validate worker context
    let sanitizedWorkerContext: WorkerContext | undefined = workerContext
    if (workerContext) {
      const workerValidation = this.inputValidator.validateWorkerContext(workerContext)
      if (!workerValidation.isValid) {
        console.warn('🚨 Invalid worker context blocked:', workerValidation.reason)
        throw new Error(`Worker context validation failed: ${workerValidation.reason}`)
      }
      sanitizedWorkerContext = workerValidation.sanitizedContent
        ? (JSON.parse(workerValidation.sanitizedContent) as WorkerContext)
        : workerContext
    }
    const currentBoardContext = sanitizedBoardContext
      ? `\n\nCURRENT CONTEXT:\nYou are currently viewing the "${sanitizedBoardContext.name}" project (ID: ${sanitizedBoardContext.id}). When creating tasks, they will be created on this project automatically. You do NOT need to call list_projects since you already know the current project.`
      : `\n\nCURRENT CONTEXT:\nNo specific project is currently selected. Use the list_projects tool to see available projects, or tasks will be created on the default project.`

    let systemPrompt = ''

    if (sanitizedWorkerContext) {
      // Use worker's custom system prompt
      systemPrompt = `${sanitizedWorkerContext.systemPrompt}

WORKER PROFILE:
- Name: ${sanitizedWorkerContext.name}
${sanitizedWorkerContext.roleDescription ? `- Role: ${sanitizedWorkerContext.roleDescription}` : ''}

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

    // Build messages array with system prompt using validated messages
    const finalMessages = [{ role: 'system', content: systemPrompt }, ...validatedMessages]

    const DEFAULT_MODEL = 'gpt-4o-mini'
    const tools = llmToolSchemas

    // Execute API call with retry logic
    return await this.retryableOperation.execute(async () => {
      // Create AbortController for request timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

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
          signal: controller.signal,
        })

        if (!response.ok) {
          const errorText = await response.text()
          clearTimeout(timeoutId) // Clear after text parsing
          const error = new Error(`Braintrust API call failed: ${response.status} ${errorText}`)

          // Call the external onRetry callback if provided and it's a retryable error
          if (_options?.onRetry && (response.status >= 500 || response.status === 429)) {
            console.log(`⚠️ Braintrust API error ${response.status}, will retry if attempts remain`)
          }

          throw error
        }

        const data = await response.json()
        clearTimeout(timeoutId) // Clear after JSON parsing
        const choice = data.choices[0]
        const responseMessage = choice?.message

        if (!responseMessage) {
          throw new Error('No response generated from LLM')
        }

        return {
          message: responseMessage.content || '',
          toolCalls: responseMessage.tool_calls || [],
          modelUsed: model || DEFAULT_MODEL,
        }
      } catch (error) {
        clearTimeout(timeoutId)
        throw error
      }
    })
  }
}
