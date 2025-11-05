import { describe, expect, it } from 'vitest'
import { generateRandomWorkerName } from './workerNames.js'

describe('generateRandomWorkerName', () => {
  it('produces names in the expected format', () => {
    for (let i = 0; i < 10; i++) {
      const name = generateRandomWorkerName()
      expect(name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/)
    }
  })

  it('emits a healthy variety of combinations', () => {
    const names = new Set<string>()
    for (let i = 0; i < 50; i++) {
      names.add(generateRandomWorkerName())
    }
    expect(names.size).toBeGreaterThan(10)
  })
})
