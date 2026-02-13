import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import dotenv from 'dotenv'
import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  ModelRegistry,
  SessionManager,
  type AgentSessionEvent,
} from '@mariozechner/pi-coding-agent'
import { getModel, type AssistantMessage, type Message, type Model } from '@mariozechner/pi-ai'

type ProviderMode = 'pi' | 'braintrust'

interface SmokeConfig {
  providerMode: ProviderMode
  providerName: string
  modelId: string
  prompt: string
  expectContains: string | null
  expectRegex: RegExp | null
  timeoutMs: number
  keepArtifacts: boolean
  setupOnly: boolean
  storageRoot: string
  model: Model<any>
  braintrustBaseUrl: string | null
  braintrustProjectId: string | null
}

const DEFAULT_BRAINTRUST_BASE_URL = 'https://api.braintrust.dev/v1/proxy'
const DEFAULT_PROMPT =
  'Reply with a short sentence confirming this Pi smoke test is connected.'

function loadEnv(): void {
  const candidatePaths = [path.resolve(process.cwd(), '.env'), path.resolve('packages/server/.env')]

  for (const envPath of candidatePaths) {
    if (existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false })
    }
  }
}

function parseTruthy(value: string | undefined): boolean {
  if (!value) {
    return false
  }
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function resolveProviderMode(): ProviderMode {
  const rawProvider = process.env.LLM_PROVIDER?.trim().toLowerCase()

  if (rawProvider === 'braintrust') {
    return 'braintrust'
  }

  if (!rawProvider || rawProvider === 'pi') {
    return 'pi'
  }

  if (rawProvider === 'stub') {
    throw new Error(
      'LLM_PROVIDER=stub bypasses Pi entirely. Set LLM_PROVIDER=pi or LLM_PROVIDER=braintrust for this smoke test.'
    )
  }

  console.warn(`Unknown LLM_PROVIDER="${rawProvider}", defaulting to pi.`)
  return 'pi'
}

function resolveModel(mode: ProviderMode): {
  model: Model<any>
  providerName: string
  braintrustBaseUrl: string | null
  braintrustProjectId: string | null
} {
  if (mode === 'braintrust') {
    const configuredModelId = process.env.BRAINTRUST_MODEL?.trim() || 'gpt-4o-mini'
    const configuredBaseUrl =
      process.env.BRAINTRUST_BASE_URL?.trim() || DEFAULT_BRAINTRUST_BASE_URL
    const configuredProjectId = process.env.BRAINTRUST_PROJECT_ID?.trim()

    if (!process.env.BRAINTRUST_API_KEY) {
      throw new Error('BRAINTRUST_API_KEY is required when LLM_PROVIDER=braintrust.')
    }

    const baseModel = getModel('openai', 'gpt-4o-mini') as Model<any> | undefined
    if (!baseModel) {
      throw new Error('Unable to initialize base OpenAI model for Braintrust smoke test.')
    }

    const baseHeaders = baseModel.headers ?? {}
    const headers =
      configuredProjectId && configuredProjectId.length > 0
        ? { ...baseHeaders, 'x-bt-parent': `project_id:${configuredProjectId}` }
        : baseHeaders
    const compat = {
      ...(baseModel.compat ?? {}),
      supportsStore: false,
      maxTokensField: 'max_tokens' as const,
    }

    const braintrustModel: Model<any> = {
      ...baseModel,
      provider: 'braintrust',
      api: 'openai-completions',
      id: configuredModelId,
      name: `Braintrust (${configuredModelId})`,
      baseUrl: configuredBaseUrl,
      headers,
      compat,
    }

    return {
      model: braintrustModel,
      providerName: 'braintrust',
      braintrustBaseUrl: configuredBaseUrl,
      braintrustProjectId:
        configuredProjectId && configuredProjectId.length > 0 ? configuredProjectId : null,
    }
  }

  const provider = process.env.PI_SMOKE_PROVIDER?.trim() || 'anthropic'
  const modelId = process.env.PI_SMOKE_MODEL?.trim() || 'claude-opus-4-5'
  const model = getModel(provider as any, modelId) as Model<any> | undefined

  if (!model) {
    throw new Error(
      `Unable to resolve Pi model provider="${provider}" id="${modelId}". Set PI_SMOKE_PROVIDER/PI_SMOKE_MODEL to valid values.`
    )
  }

  return {
    model,
    providerName: provider,
    braintrustBaseUrl: null,
    braintrustProjectId: null,
  }
}

function parseRegex(value: string | undefined): RegExp | null {
  if (!value) {
    return null
  }
  return new RegExp(value)
}

function resolveStorageRoot(): string {
  const explicitStorageDir = process.env.PI_SMOKE_STORAGE_DIR?.trim()
  if (explicitStorageDir) {
    return path.resolve(explicitStorageDir)
  }

  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`
  return path.resolve(process.cwd(), '.context', `pi-smoke-${runId}`)
}

function buildConfig(): SmokeConfig {
  const providerMode = resolveProviderMode()
  const { model, providerName, braintrustBaseUrl, braintrustProjectId } = resolveModel(providerMode)

  return {
    providerMode,
    providerName,
    modelId: model.id,
    model,
    prompt: process.env.PI_SMOKE_PROMPT?.trim() || DEFAULT_PROMPT,
    expectContains: process.env.PI_SMOKE_EXPECT_CONTAINS?.trim() || null,
    expectRegex: parseRegex(process.env.PI_SMOKE_EXPECT_REGEX),
    timeoutMs: parsePositiveInt(process.env.PI_SMOKE_TIMEOUT_MS, 60_000),
    keepArtifacts: parseTruthy(process.env.PI_SMOKE_KEEP_ARTIFACTS),
    setupOnly: parseTruthy(process.env.PI_SMOKE_SETUP_ONLY),
    storageRoot: resolveStorageRoot(),
    braintrustBaseUrl,
    braintrustProjectId,
  }
}

function extractAssistantText(message: Message): string {
  if (message.role !== 'assistant') {
    return ''
  }

  return message.content
    .filter(part => part.type === 'text')
    .map(part => part.text)
    .join('')
}

function isAssistantErrorMessage(message: Message): message is AssistantMessage {
  if (message.role !== 'assistant') {
    return false
  }

  return (
    message.stopReason === 'error' ||
    message.stopReason === 'aborted' ||
    typeof message.errorMessage === 'string'
  )
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeout: NodeJS.Timeout | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) {
      clearTimeout(timeout)
    }
  }) as Promise<T>
}

async function runSmokeTest(): Promise<void> {
  loadEnv()
  const config = buildConfig()

  console.log('Starting Pi smoke test...')
  console.log(`Provider mode: ${config.providerMode}`)
  console.log(`Model provider: ${config.providerName}`)
  console.log(`Model id: ${config.modelId}`)
  console.log(`Storage root: ${config.storageRoot}`)
  if (config.providerMode === 'braintrust') {
    console.log(`Braintrust base URL: ${config.braintrustBaseUrl}`)
    console.log(`Braintrust project configured: ${Boolean(config.braintrustProjectId)}`)
  }
  if (config.setupOnly) {
    console.log('Setup-only mode enabled. No prompt will be sent.')
  }

  const agentDir = path.join(config.storageRoot, 'agent')
  const sessionDir = path.join(config.storageRoot, 'session')
  await fs.mkdir(agentDir, { recursive: true })
  await fs.mkdir(sessionDir, { recursive: true })

  const authStorage = new AuthStorage(path.join(agentDir, 'auth.json'))
  const modelRegistry = new ModelRegistry(authStorage, path.join(agentDir, 'models.json'))

  if (config.providerMode === 'braintrust' && config.braintrustBaseUrl) {
    const headers: Record<string, string> | undefined = config.braintrustProjectId
      ? { 'x-bt-parent': `project_id:${config.braintrustProjectId}` }
      : undefined

    modelRegistry.registerProvider('braintrust', {
      baseUrl: config.braintrustBaseUrl,
      apiKey: 'BRAINTRUST_API_KEY',
      headers,
    })
  }

  const resourceLoader = new DefaultResourceLoader({
    cwd: process.cwd(),
    agentDir,
  })
  await resourceLoader.reload()

  const sessionManager = SessionManager.create(process.cwd(), sessionDir)
  const { session } = await createAgentSession({
    model: config.model,
    authStorage,
    modelRegistry,
    resourceLoader,
    sessionManager,
    tools: [],
    customTools: [],
  })

  const stats = {
    turnEndCount: 0,
    toolExecutionStartCount: 0,
    toolExecutionEndCount: 0,
    messageEndCount: 0,
    agentEndCount: 0,
  }
  const assistantMessages: string[] = []
  let sawErrorState = false
  let failureContext: Record<string, unknown> | null = null
  let completedSuccessfully = false

  const unsubscribe = session.subscribe((event: AgentSessionEvent) => {
    switch (event.type) {
      case 'turn_end':
        stats.turnEndCount += 1
        break
      case 'tool_execution_start':
        stats.toolExecutionStartCount += 1
        break
      case 'tool_execution_end':
        stats.toolExecutionEndCount += 1
        break
      case 'message_end': {
        stats.messageEndCount += 1
        if (event.message.role === 'assistant') {
          const text = extractAssistantText(event.message).trim()
          if (text.length > 0) {
            assistantMessages.push(text)
          }
          if (isAssistantErrorMessage(event.message)) {
            sawErrorState = true
            failureContext = {
              source: 'message_end',
              stopReason: event.message.stopReason,
              errorMessage:
                'errorMessage' in event.message ? (event.message.errorMessage ?? null) : null,
            }
          }
        }
        break
      }
      case 'agent_end': {
        stats.agentEndCount += 1
        const latestAssistantMessage = [...event.messages]
          .reverse()
          .find((message): message is AssistantMessage => message.role === 'assistant')
        if (latestAssistantMessage) {
          if (isAssistantErrorMessage(latestAssistantMessage)) {
            sawErrorState = true
            failureContext = {
              source: 'agent_end',
              stopReason: latestAssistantMessage.stopReason,
              errorMessage:
                'errorMessage' in latestAssistantMessage
                  ? (latestAssistantMessage.errorMessage ?? null)
                  : null,
            }
          }
        }
        break
      }
      default:
        break
    }
  })

  const startedAt = Date.now()

  try {
    await session.setModel(config.model)

    if (!config.setupOnly) {
      await withTimeout(session.prompt(config.prompt), config.timeoutMs, 'Pi smoke test prompt')
    }

    const durationMs = Date.now() - startedAt
    const combinedResponse = assistantMessages.join('\n').trim()

    if (sawErrorState) {
      throw new Error(`Pi reported an error state: ${JSON.stringify(failureContext)}`)
    }

    if (!config.setupOnly && combinedResponse.length === 0) {
      throw new Error(
        'Pi prompt completed without assistant text. Set PI_SMOKE_KEEP_ARTIFACTS=1 to inspect artifacts.'
      )
    }

    if (config.expectContains && !combinedResponse.includes(config.expectContains)) {
      throw new Error(
        `Assistant response did not include PI_SMOKE_EXPECT_CONTAINS="${config.expectContains}". Response: ${combinedResponse}`
      )
    }

    if (config.expectRegex && !config.expectRegex.test(combinedResponse)) {
      throw new Error(
        `Assistant response did not match PI_SMOKE_EXPECT_REGEX=${config.expectRegex}. Response: ${combinedResponse}`
      )
    }

    completedSuccessfully = true
    console.log('\nPi smoke test passed.')
    console.log(`Duration: ${durationMs}ms`)
    console.log(`turn_end events: ${stats.turnEndCount}`)
    console.log(`tool starts: ${stats.toolExecutionStartCount}`)
    console.log(`tool ends: ${stats.toolExecutionEndCount}`)
    if (!config.setupOnly) {
      console.log(`Assistant response: ${combinedResponse}`)
    }
  } finally {
    unsubscribe()

    try {
      await session.dispose()
    } catch (error) {
      console.warn(
        `Failed to dispose Pi session cleanly: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    const keepArtifacts = config.keepArtifacts || !completedSuccessfully
    if (keepArtifacts) {
      console.log(`Artifacts kept at: ${config.storageRoot}`)
    } else {
      await fs.rm(config.storageRoot, { recursive: true, force: true })
    }
  }
}

runSmokeTest().catch(error => {
  console.error('\nPi smoke test failed.')
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exitCode = 1
})
