import type { CategoryToken, StreamKey } from './visualLanguage.js'
import { CATEGORY_TOKENS } from './visualLanguage.js'

export interface PrototypeEntry {
  id: string
  route: string
  title: string
  summary: string
  stream: StreamKey
  category: CategoryToken['id']
  status: 'active' | 'draft'
}

export const PROTOTYPES: readonly PrototypeEntry[] = [
  {
    id: 'hex-grid',
    route: '/hex-grid',
    title: 'Hex Grid Terrain',
    summary:
      'Interactive 3D terrain with pathfinding, sprite placement, and shader tuning controls.',
    stream: 'gold',
    category: 'personal-growth',
    status: 'active',
  },
  {
    id: 'state-signals',
    route: '/state-signals',
    title: 'State Signal Lab',
    summary:
      'Visual language probe for category colors, saturation states, stream accents, and entity markers.',
    stream: 'silver',
    category: 'relationships',
    status: 'active',
  },
  {
    id: 'stream-arena',
    route: '/stream-arena',
    title: 'Stream Arena',
    summary:
      'Mini simulator for assigning active work into Gold, Silver, and Bronze lanes while preserving slot constraints.',
    stream: 'silver',
    category: 'finances',
    status: 'active',
  },
  {
    id: 'signal-garden',
    route: '/signal-garden',
    title: 'Signal Garden',
    summary:
      'Tap through a living field of hex cells to test color-state combinations and spatial scanning speed.',
    stream: 'bronze',
    category: 'community',
    status: 'active',
  },
] as const

export const prototypeCount = PROTOTYPES.length

export const getCategoryById = (categoryId: string) =>
  CATEGORY_TOKENS.find(category => category.id === categoryId) ?? CATEGORY_TOKENS[0]

export const getPrototypeByRoute = (route: string) =>
  PROTOTYPES.find(prototype => prototype.route === route) ?? null
