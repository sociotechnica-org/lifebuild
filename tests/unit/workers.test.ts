import { describe, expect, it } from 'vitest'
import { generateRandomWorkerName } from '../../src/util/workerNames.js'

describe('Worker Name Generation', () => {
  it('should generate different names on subsequent calls', () => {
    const name1 = generateRandomWorkerName()
    const name2 = generateRandomWorkerName()

    expect(name1).toMatch(/^[A-Za-z]+ [A-Za-z]+$/)
    expect(name2).toMatch(/^[A-Za-z]+ [A-Za-z]+$/)
    expect(name1).not.toBe(name2) // Very unlikely to be the same
  })
})
