import fs from 'fs'
import path from 'path'
import type {
  LLMProvider,
  LLMResponse,
  LLMMessage,
  BoardContext,
  WorkerContext,
  LLMCallOptions,
  ToolCall,
} from './types.js'
import { InputValidator } from './input-validator.js'
import { logger } from '../../utils/logger.js'

type MatchType = 'exact' | 'includes' | 'regex'

interface StubResponseRule {
  match: string
  response: string
  matchType?: MatchType
  toolCalls?: ToolCall[]
}

interface StubConfig {
  defaultResponse?: string
  responses?: StubResponseRule[]
}

const DEFAULT_RESPONSE = 'Stubbed response'

const parseStubConfig = (raw: unknown): StubConfig => {
  if (!raw || typeof raw !== 'object') {
    return { responses: [] }
  }

  const record = raw as Record<string, unknown>
  if ('responses' in record || 'defaultResponse' in record) {
    return {
      defaultResponse:
        typeof record.defaultResponse === 'string' ? record.defaultResponse : undefined,
      responses: Array.isArray(record.responses)
        ? (record.responses.filter(Boolean) as StubResponseRule[])
        : [],
    }
  }

  const responses = Object.entries(record)
    .filter(([, value]) => typeof value === 'string')
    .map(([match, response]) => ({ match, response: response as string }))

  return { responses }
}

const loadStubConfigFromEnv = (): StubConfig => {
  const rawJson = process.env.LLM_STUB_RESPONSES
  const fixturePath = process.env.LLM_STUB_FIXTURE_PATH

  let rawConfig: unknown = undefined

  if (rawJson) {
    try {
      rawConfig = JSON.parse(rawJson)
    } catch (error) {
      throw new Error(`LLM_STUB_RESPONSES is not valid JSON: ${(error as Error).message}`)
    }
  } else if (fixturePath) {
    const resolvedPath = path.resolve(process.cwd(), fixturePath)
    const fileContents = fs.readFileSync(resolvedPath, 'utf-8')
    try {
      rawConfig = JSON.parse(fileContents)
    } catch (error) {
      throw new Error(`LLM_STUB_FIXTURE_PATH JSON invalid: ${(error as Error).message}`)
    }
  }

  const config = parseStubConfig(rawConfig)
  if (process.env.LLM_STUB_DEFAULT_RESPONSE) {
    config.defaultResponse = process.env.LLM_STUB_DEFAULT_RESPONSE
  }

  return config
}

const renderTemplate = (template: string, message: string): string => {
  return template.replace(/\{\{\s*message\s*\}\}/g, message)
}

export class StubLLMProvider implements LLMProvider {
  private config: StubConfig
  private inputValidator: InputValidator

  constructor(config?: StubConfig, customValidator?: InputValidator) {
    this.config = config ?? { responses: [] }
    this.inputValidator = customValidator ?? new InputValidator()
  }

  static fromEnv(): StubLLMProvider {
    const config = loadStubConfigFromEnv()
    return new StubLLMProvider(config)
  }

  async call(
    messages: LLMMessage[],
    _boardContext?: BoardContext,
    _model?: string,
    _workerContext?: WorkerContext,
    _options?: LLMCallOptions
  ): Promise<LLMResponse> {
    const messageValidation = this.inputValidator.validateMessages(messages)
    if (!messageValidation.isValid) {
      logger.warn({ reason: messageValidation.reason }, 'Invalid input messages blocked')
      throw new Error(`Input validation failed: ${messageValidation.reason}`)
    }

    const validatedMessages = JSON.parse(messageValidation.sanitizedContent!) as LLMMessage[]
    const lastUserMessage = [...validatedMessages]
      .reverse()
      .find(message => message.role === 'user' && typeof message.content === 'string')

    const userContent = lastUserMessage?.content ?? ''
    const resolved = this.resolveResponse(userContent)

    return {
      message: resolved.message,
      toolCalls: resolved.toolCalls ?? [],
    }
  }

  private resolveResponse(message: string): { message: string; toolCalls?: ToolCall[] } {
    const responses = this.config.responses ?? []

    for (const rule of responses) {
      if (!rule?.match || typeof rule.response !== 'string') continue
      const matchType = rule.matchType ?? 'exact'

      if (matchType === 'regex') {
        try {
          const regex = new RegExp(rule.match)
          if (regex.test(message)) {
            return {
              message: renderTemplate(rule.response, message),
              toolCalls: rule.toolCalls,
            }
          }
        } catch (error) {
          logger.warn({ error, match: rule.match }, 'Invalid regex in stub rule')
        }
        continue
      }

      if (matchType === 'includes') {
        if (message.includes(rule.match)) {
          return {
            message: renderTemplate(rule.response, message),
            toolCalls: rule.toolCalls,
          }
        }
        continue
      }

      if (message === rule.match) {
        return {
          message: renderTemplate(rule.response, message),
          toolCalls: rule.toolCalls,
        }
      }
    }

    const fallback = this.config.defaultResponse ?? DEFAULT_RESPONSE
    return { message: renderTemplate(fallback, message) }
  }
}
