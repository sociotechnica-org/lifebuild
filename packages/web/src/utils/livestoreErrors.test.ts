import { describe, expect, it } from 'vitest'
import { isLiveStoreHeadMismatchError } from './livestoreErrors.js'

describe('isLiveStoreHeadMismatchError', () => {
  it('matches the head mismatch error message', () => {
    const error = new Error(
      'During boot the backend head (9) should never be greater than the local head (8)'
    )
    expect(isLiveStoreHeadMismatchError(error)).toBe(true)
  })

  it('matches nested causes', () => {
    const nested = {
      cause: new Error(
        'During boot the backend head (5) should never be greater than the local head (4)'
      ),
    }
    expect(isLiveStoreHeadMismatchError(nested)).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    const error = new Error('Something else happened')
    expect(isLiveStoreHeadMismatchError(error)).toBe(false)
  })
})
