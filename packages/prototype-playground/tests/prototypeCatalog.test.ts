import { describe, expect, it } from 'vitest'
import { PROTOTYPES, prototypeCount } from '../src/lib/prototypeCatalog.js'

describe('prototype catalog', () => {
  it('registers at least four playground prototypes', () => {
    expect(prototypeCount).toBeGreaterThanOrEqual(4)
    expect(PROTOTYPES).toHaveLength(prototypeCount)
  })

  it('includes the hex-grid route', () => {
    expect(PROTOTYPES.some(prototype => prototype.route === '/hex-grid')).toBe(true)
  })

  it('uses unique prototype routes', () => {
    const routes = PROTOTYPES.map(prototype => prototype.route)
    expect(new Set(routes).size).toBe(routes.length)
  })
})
