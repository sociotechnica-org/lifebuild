/**
 * Supported AI models for worker conversations
 */
export interface SupportedModel {
  id: string
  name: string
  provider: 'anthropic' | 'openai'
  description?: string
}

export const supportedModels: SupportedModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude 4 Sonnet',
    provider: 'anthropic',
    description: 'Fast, intelligent model for most tasks',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: "OpenAI's multimodal flagship model",
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude 4 Opus',
    provider: 'anthropic',
    description: 'Most capable model for complex tasks',
  },
  {
    id: 'o3',
    name: 'OpenAI O3',
    provider: 'openai',
    description: 'Advanced reasoning model',
  },
]

/**
 * Default model for new conversations
 */
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

/**
 * Get a model by ID
 */
export const getModelById = (modelId: string): SupportedModel | undefined => {
  return supportedModels.find(model => model.id === modelId)
}

/**
 * Validate if a model ID is supported
 */
export const isValidModelId = (modelId: string): boolean => {
  return supportedModels.some(model => model.id === modelId)
}
