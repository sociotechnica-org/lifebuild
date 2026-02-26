export interface PrototypeEntry {
  id: string
  route: string
  title: string
  summary: string
  status: 'active' | 'draft'
}

export const PROTOTYPES: readonly PrototypeEntry[] = [
  {
    id: 'hex-grid',
    route: '/hex-grid',
    title: 'Hex Grid Terrain',
    summary:
      'Interactive 3D terrain with pathfinding, sprite placement, and shader tuning controls.',
    status: 'active',
  },
  {
    id: 'campfire-reveal',
    route: '/campfire-reveal',
    title: 'Campfire Reveal',
    summary:
      'Portal onboarding sequence: Jarvis campfire → builder input → hex materializes on dark map.',
    status: 'active',
  },
] as const

export const prototypeCount = PROTOTYPES.length
