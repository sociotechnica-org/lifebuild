export interface SupportedModel {
  id: string
  name: string
  provider: 'anthropic' | 'openai'
  description?: string
}

export const MODEL_IDS = {
  CLAUDE_SONNET: 'claude-sonnet-4-20250514',
  CLAUDE_OPUS: 'claude-opus-4-1-20250805',
  GPT_5: 'gpt-5-2025-08-07',
  O3: 'o3-2025-04-16',
} as const

export type ModelId = (typeof MODEL_IDS)[keyof typeof MODEL_IDS]

export const supportedModels: SupportedModel[] = [
  {
    id: MODEL_IDS.CLAUDE_SONNET,
    name: 'Claude 4 Sonnet',
    provider: 'anthropic',
    description: 'Fast, intelligent model for most tasks',
  },
  {
    id: MODEL_IDS.CLAUDE_OPUS,
    name: 'Claude 4.1 Opus',
    provider: 'anthropic',
    description: 'Most capable model for complex tasks',
  },
  {
    id: MODEL_IDS.GPT_5,
    name: 'GPT-5',
    provider: 'openai',
    description: 'Next-generation language model',
  },
  {
    id: MODEL_IDS.O3,
    name: 'OpenAI O3',
    provider: 'openai',
    description: 'Advanced reasoning model',
  },
]

export const DEFAULT_MODEL = MODEL_IDS.CLAUDE_SONNET

export const getModelById = (modelId: string): SupportedModel | undefined => {
  return supportedModels.find(model => model.id === modelId)
}

export const isValidModelId = (modelId: string): modelId is ModelId => {
  return supportedModels.some(model => model.id === modelId)
}
