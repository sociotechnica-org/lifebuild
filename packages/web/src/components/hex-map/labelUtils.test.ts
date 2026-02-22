import { describe, expect, it } from 'vitest'
import { truncateLabel } from './labelUtils.js'

describe('truncateLabel', () => {
  it('returns original label when it is within max length', () => {
    expect(truncateLabel('Short label', 20)).toBe('Short label')
  })

  it('truncates and appends an ellipsis when label exceeds max length', () => {
    expect(truncateLabel('Very long project label', 10)).toBe('Very lo...')
  })
})
