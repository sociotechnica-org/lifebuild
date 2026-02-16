import fs from 'node:fs'
import path from 'node:path'
import { logger } from '../../utils/logger.js'

type MatchType = 'exact' | 'includes' | 'regex'

interface StubResponseRule {
  match: string
  response?: string
  error?: string
  matchType?: MatchType
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
  return template.replace(/\{\{\s*message\s*\}\}/g, () => message)
}

const resolveStubResponse = (
  config: StubConfig,
  message: string
): {
  message?: string
  error?: string
} => {
  const responses = config.responses ?? []

  for (const rule of responses) {
    const hasResponse = typeof rule.response === 'string'
    const hasError = typeof rule.error === 'string'
    if (!rule?.match || (!hasResponse && !hasError)) continue
    const matchType = rule.matchType ?? 'exact'
    const resolved = () => {
      if (hasError) {
        return { error: renderTemplate(rule.error!, message) }
      }
      return { message: renderTemplate(rule.response!, message) }
    }

    if (matchType === 'regex') {
      try {
        const regex = new RegExp(rule.match)
        if (regex.test(message)) {
          return resolved()
        }
      } catch (error) {
        logger.warn({ error, match: rule.match }, 'Invalid regex in stub rule')
      }
      continue
    }

    if (matchType === 'includes') {
      if (message.includes(rule.match)) {
        return resolved()
      }
      continue
    }

    if (message === rule.match) {
      return resolved()
    }
  }

  const fallback = config.defaultResponse ?? DEFAULT_RESPONSE
  return { message: renderTemplate(fallback, message) }
}

export const createStubResponder = (): ((message: string) => string) => {
  const config = loadStubConfigFromEnv()
  return (message: string) => {
    const resolved = resolveStubResponse(config, message)
    if (resolved.error) {
      throw new Error(resolved.error)
    }
    return resolved.message ?? ''
  }
}
