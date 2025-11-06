import { describe, expect, it } from 'vitest'
import {
  supportedModels,
  DEFAULT_MODEL,
  getModelById,
  isValidModelId,
  MODEL_IDS,
} from './models.js'

describe('Models utility', () => {
  it('should have claude-sonnet-4-20250514 as default model', () => {
    expect(DEFAULT_MODEL).toBe(MODEL_IDS.CLAUDE_SONNET)
  })

  it('should get model by ID', () => {
    const model = getModelById(MODEL_IDS.CLAUDE_SONNET)
    expect(model).toBeDefined()
    expect(model?.name).toBe('Claude 4 Sonnet')
    expect(model?.provider).toBe('anthropic')
  })

  it('should return undefined for invalid model ID', () => {
    const model = getModelById('invalid-model')
    expect(model).toBeUndefined()
  })

  it('should validate model IDs correctly', () => {
    expect(isValidModelId(MODEL_IDS.CLAUDE_SONNET)).toBe(true)
    expect(isValidModelId(MODEL_IDS.GPT_5)).toBe(true)
    expect(isValidModelId(MODEL_IDS.O3)).toBe(true)
    expect(isValidModelId('invalid-model')).toBe(false)
  })

  it('should include all expected models', () => {
    const modelIds = supportedModels.map(m => m.id)
    expect(modelIds).toContain(MODEL_IDS.CLAUDE_SONNET)
    expect(modelIds).toContain(MODEL_IDS.CLAUDE_OPUS)
    expect(modelIds).toContain(MODEL_IDS.GPT_5)
    expect(modelIds).toContain(MODEL_IDS.O3)
  })
})
