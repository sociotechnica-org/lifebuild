export interface SupportedModel {
  id: string
  name: string
  provider: 'anthropic' | 'openai'
  description?: string
}

export const MODEL_IDS = {
  CLAUDE_SONNET: 'claude-sonnet-4-5-20250929',
  CLAUDE_HAIKU: 'claude-haiku-4-5-20251001',
  GPT_5: 'gpt-5-2025-08-07',
  O3: 'o3-2025-04-16',
} as const

export type ModelId = (typeof MODEL_IDS)[keyof typeof MODEL_IDS]

export const supportedModels: SupportedModel[] = [
  {
    id: MODEL_IDS.CLAUDE_SONNET,
    name: 'Claude 4.5 Sonnet',
    provider: 'anthropic',
    description: 'Balanced model for high-quality general tasks',
  },
  {
    id: MODEL_IDS.CLAUDE_HAIKU,
    name: 'Claude 4.5 Haiku',
    provider: 'anthropic',
    description: 'Fastest Claude 4.5 model for lightweight tasks',
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

export const DEFAULT_MODEL_STRING = MODEL_IDS.CLAUDE_SONNET

export const DEFAULT_MODEL: ModelId = DEFAULT_MODEL_STRING

export const getModelById = (modelId: string): SupportedModel | undefined => {
  return supportedModels.find(model => model.id === modelId)
}

export const isValidModelId = (modelId: string): modelId is ModelId => {
  return supportedModels.some(model => model.id === modelId)
}
