export interface CategoryToken {
  id: string
  name: string
  colorHex: string
  rationale: string
}

export const CATEGORY_TOKENS: readonly CategoryToken[] = [
  {
    id: 'health',
    name: 'Health',
    colorHex: '#1FA55A',
    rationale: 'Vibrant green for physical vitality and momentum.',
  },
  {
    id: 'purpose',
    name: 'Purpose',
    colorHex: '#4A49C9',
    rationale: 'Deep indigo for direction, mission, and meaning.',
  },
  {
    id: 'finances',
    name: 'Finances',
    colorHex: '#D8A650',
    rationale: 'Gold/amber for value, reserves, and resources.',
  },
  {
    id: 'relationships',
    name: 'Relationships',
    colorHex: '#DE5A82',
    rationale: 'Warm rose for human bonds and belonging.',
  },
  {
    id: 'home',
    name: 'Home',
    colorHex: '#B56C4A',
    rationale: 'Terracotta for shelter, upkeep, and place-making.',
  },
  {
    id: 'community',
    name: 'Community',
    colorHex: '#E97C30',
    rationale: 'Orange for neighborhood energy and contribution.',
  },
  {
    id: 'leisure',
    name: 'Leisure',
    colorHex: '#4CA8F8',
    rationale: 'Sky blue for play, recovery, and spaciousness.',
  },
  {
    id: 'personal-growth',
    name: 'Personal Growth',
    colorHex: '#20A49C',
    rationale: 'Teal for learning, skill-building, and stretch.',
  },
] as const

export const STREAM_TOKENS = {
  gold: {
    label: 'Gold',
    colorHex: '#D8A650',
    description: 'Transformation and expansion work.',
  },
  silver: {
    label: 'Silver',
    colorHex: '#C5CED8',
    description: 'Capacity and infrastructure work.',
  },
  bronze: {
    label: 'Bronze',
    colorHex: '#C48B5A',
    description: 'Maintenance and anti-decay work.',
  },
} as const

export type StreamKey = keyof typeof STREAM_TOKENS

export const STATE_TREATMENTS = {
  live: {
    label: 'Live',
    saturation: 1,
    opacity: 1,
    glow: false,
  },
  planned: {
    label: 'Planned',
    saturation: 0.6,
    opacity: 0.9,
    glow: false,
  },
  paused: {
    label: 'Paused',
    saturation: 0.3,
    opacity: 0.78,
    glow: false,
  },
  workAtHand: {
    label: 'Work at Hand',
    saturation: 1.18,
    opacity: 1,
    glow: true,
  },
} as const

export type StateKey = keyof typeof STATE_TREATMENTS

export const DEFAULT_TEXT = {
  ink: '#2F2B27',
  muted: '#7E7468',
  parchment: '#F6EFE2',
  parchmentEdge: '#E8DBC5',
} as const
