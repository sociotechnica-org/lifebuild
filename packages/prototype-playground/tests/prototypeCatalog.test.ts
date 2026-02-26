import { describe, expect, it } from 'vitest'
import { PROTOTYPES, prototypeCount } from '../src/lib/prototypeCatalog.js'

describe('prototype catalog', () => {
  it('registers only the hex-grid prototype for now', () => {
    expect(prototypeCount).toBe(1)
    expect(PROTOTYPES).toHaveLength(1)
  })

  it('uses /hex-grid as the only prototype route', () => {
    expect(PROTOTYPES[0]?.route).toBe('/hex-grid')
    expect(PROTOTYPES.map(prototype => prototype.route)).toEqual(['/hex-grid'])
  })
})
