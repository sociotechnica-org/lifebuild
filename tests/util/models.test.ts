import { describe, expect, it } from 'vitest'
import {
  supportedModels,
  DEFAULT_MODEL,
  getModelById,
  isValidModelId,
} from '../../src/util/models.js'

describe('Models utility', () => {
  it('should have claude-3-5-sonnet-latest as default model', () => {
    expect(DEFAULT_MODEL).toBe('claude-3-5-sonnet-latest')
  })

  it('should get model by ID', () => {
    const model = getModelById('claude-3-5-sonnet-latest')
    expect(model).toBeDefined()
    expect(model?.name).toBe('Claude 3.5 Sonnet')
    expect(model?.provider).toBe('anthropic')
  })

  it('should return undefined for invalid model ID', () => {
    const model = getModelById('invalid-model')
    expect(model).toBeUndefined()
  })

  it('should validate model IDs correctly', () => {
    expect(isValidModelId('claude-3-5-sonnet-latest')).toBe(true)
    expect(isValidModelId('gpt-4o')).toBe(true)
    expect(isValidModelId('invalid-model')).toBe(false)
  })

  it('should include all expected models', () => {
    const modelIds = supportedModels.map(m => m.id)
    expect(modelIds).toContain('claude-3-5-sonnet-latest')
    expect(modelIds).toContain('gpt-4o')
    expect(modelIds).toContain('claude-3-opus-latest')
    expect(modelIds).toContain('o3')
  })
})
